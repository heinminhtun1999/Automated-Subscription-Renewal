const logger = require("../utils/services/winston");
const db = require("../db/db");
const { SHEET_CONFIGS, PAYMENT_STATUS, PAYMENT_REQUIRED_FIELDS } = require("../utils/constants");
const { uid, getUserMessage } = require("../utils/dataProcessors");
const { preparePaymentBody } = require("../utils/services/fiuu");
const { redirectTemplate, customerSubscriptionRenewalSuccessTemplate, subscriptionRenewalSuccessTemplate } = require("../utils/htmlTemplates");
const { insertOrder, updateOrder, getOrder } = require("../repositories/orderRepository");
const { getCustomerById } = require("../repositories/customerRepository");
const { insertOrderItem, getOrderItemsByOrderId } = require("../repositories/orderItemRepository");
const { getMachinesByIds, updateMachine } = require("../repositories/machineRepository");
const { getEmailMachineByRenewalProcessIds, updateMultipleEmailMachinesByOrderIdAndMachineIds, updateEmailMachineByMachineIdAndRenewalProcessId } = require("../repositories/emailMachinesRepository");
const { validateSkey, checkRequiredFields, localizedDateTime } = require("../utils/utils");
const { sendEmail } = require("../utils/services/nodemailer");

// Build payment request, persist order + items, and redirect to gateway.
async function requestPayment(req, res, next) {

    const { machineIds, customerId } = req.body;

    // Checking if the customerID present in the payload
    if (!customerId) {
        const err = new Error('Requested data not found. Please refresh the page and try again.\nIf the issue persists, contact support.');
        err.title = "Not Found";
        err.status = 400;
        return next(err);
    }

    const machineIdsFromPayload = JSON.parse(machineIds || []);
    if (machineIdsFromPayload.length === 0) {
        const err = new Error('No machines selected. Please select at least one machine and try again.');
        err.title = "Bad Request";
        err.status = 400;
        return next(err);
    }

    const selectedMachines = getMachinesByIds(machineIdsFromPayload);
    if (selectedMachines.length === 0 || selectedMachines.length !== machineIdsFromPayload.length) {
        const err = new Error('Selected machines not found.\nIf the issue persists, contact support.');
        err.title = "Not Found";
        err.status = 400;
        return next(err);
    }

    const renewalProcessIds = selectedMachines.map(machine => machine.renewal_process_id);
    const emailMachines = getEmailMachineByRenewalProcessIds(renewalProcessIds);
    const emailMachineRenewalProcessIds = emailMachines.map(em => em.renewal_process_id);
    const areAllMachineIdsValid = machineIdsFromPayload.every(id => emailMachines.some(emailMachine => emailMachine.machine_id === parseInt(id)));
    if (emailMachines.length === 0 || renewalProcessIds.length !== emailMachines.length || !areAllMachineIdsValid) {
        const err = new Error('We have encountered an issue while processing your request.\nIf the issue persists, contact support.');
        err.title = "Server Error";
        err.status = 500;
        return next(err);
    }


    try {

        const customer = getCustomerById(customerId);

        // Sum fees for payment amount.
        const total = selectedMachines.reduce((sum, machine) => sum + parseFloat(machine.subscription_fees), 0).toFixed(2);

        // Construct body for PG request payload
        const bodyData = {
            beneficiaryName: customer.beneficiary_name,
            email: customer.email,
            contactNumber: customer.contact_number,
            companyName: customer.company_name,
            total: total
        }

        // Prepare URL for return, callback and cancel urls
        const baseURL = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;

        const paymentBody = preparePaymentBody(bodyData, baseURL);

        const orderInfo = {
            orderId: paymentBody.orderid,
            customerId: customer.id,
            amount: parseFloat(bodyData.total).toFixed(2),
        }
        
        // Atomically insert order and items.
        db.transaction(() => {
            insertOrder(orderInfo);
            for (const machines of selectedMachines) {
                insertOrderItem(
                    orderInfo.orderId,
                    machines.id
                );
                const result = updateEmailMachineByMachineIdAndRenewalProcessId(machines.id, machines.renewal_process_id, { order_id: orderInfo.orderId });
            }
        }).immediate(orderInfo, selectedMachines);

        // Convert payload to hidden form inputs for gateway POST.
        const hiddenInputs = Object.entries(paymentBody).map(([key, value]) => {
            return `<input type="hidden" name="${key}" value="${value}">`;
        });

        return res.status(200).send(redirectTemplate(hiddenInputs));

    } catch (error) {
        logger.error('Error preparing payment:', error);
        const err = new Error('An error occurred while preparing the payment. Please try again later.\nIf the issue persists, contact support.');
        err.status = 500;
        return next(err);
    }
}

// Render post-payment return screen after browser redirect.
function paymentReturn(req, res, next) {

    const body = req.body;
    if (!body || Object.keys(body).length === 0) {
        const err = new Error('No data received from payment gateway. If you have completed the payment, please contact support for assistance.');
        err.title = 'Order Processing Error';
        err.status = 400;
        return next(err);
    }

    const requiredFieldsCheck = checkRequiredFields(body, PAYMENT_REQUIRED_FIELDS);
    if (!requiredFieldsCheck.valid) {
        const missingField = requiredFieldsCheck.missingField;
        logger.warn(`Missing ${missingField} in payment return data:`, body);

        const err = new Error('Error processing the payment data received from the payment gateway. If you have completed the payment, please contact support with your order information for assistance.');
        err.title = 'Order Processing Error';
        err.status = 400;
        return next(err);
    }

    // Fail closed if signature validation fails.
    if (!validateSkey(body)) {
        logger.warn('Hash verification failed for payment return:', body, 'Computed Skey:', computeSkey(body), 'Provided Skey:', body.skey);
        const err = new Error('Invalid data signature in payment return.');
        err.title = 'Order Processing Error';
        err.status = 400;
        return next(err);
    }

    try {
        const existingOrder = getOrder(body.orderid);
        body.amount = parseFloat(body.amount).toFixed(2);

        if (!existingOrder) {
            logger.error('Order not found for payment return:', body.orderid);
            return res.render('return', {
                data: {
                    orderId: body.orderid,
                    amount: body.amount,
                    transactionId: body.tranID,
                    paymentStatus: 'error',
                    processStatus: 'error',
                    transactionDate: localizedDateTime(body.created_at),
                    message: `Order not found for ${body.orderid}. If you have completed the payment, please contact support with your order information for assistance.`,
                }
            });
        }

        // Getting machines from order
        const machinesFromOrder = getOrderItemsByOrderId(existingOrder.order_id);
        const machineIdsFromOrder = machinesFromOrder.map(item => item.machine_id);
        const machines = getMachinesByIds(machineIdsFromOrder);

        // Concurrency checking
        const result = updateOrder(existingOrder.order_id,
            {
                process_status: 'processing',
                process_worker_level: 1
            },
            {   // Where conditions
                process_status: {
                    operator: '=',
                    value: 'pending'
                }
            });
        if (result.changes === 0) {

            logger.warn('No order record updated to processing status for payment return. Possible concurrent update or order already processed: ', body.orderid);
            let failedRemark = existingOrder.failed_remark;
            failedRemark = failedRemark ? "\n" + failedRemark.split(",").filter(m => m.includes("Error Description")).join("").replace("Error Description: ", "Reason: ") : "";
            
            return res.render('return', {
                data: {
                    orderId: existingOrder.order_id,
                    transactionId: existingOrder.transaction_id || body.tranID,
                    amount: existingOrder.amount.toFixed(2),
                    processStatus: existingOrder.process_status,
                    message: getUserMessage(existingOrder.payment_status, existingOrder.process_status) + failedRemark,
                    paymentStatus: existingOrder.payment_status,
                    transactionDate: localizedDateTime(existingOrder.created_at),
                    machines: existingOrder.payment_status === 'paid' && existingOrder.process_status === 'completed' ? machines : null
                }
            });
        }

        // ----------- Handle different payment statuses and update order accordingly. -----------

        // Failed payment - mark order as failed with failure remark to prevent retries, and show failure message. 
        // Process status remains pending as we are waiting for callback to confirm final status; 
        // if callback is not received within expected timeframe, we have a cron job to mark it as 
        // completed with failed status to prevent indefinite pending state.
        if (body.status === "11") {
            updateOrder(existingOrder.order_id, {
                transaction_id: body.tranID,
                payment_status: PAYMENT_STATUS[body.status],
                failed_remark: `Error Code: ${body.error_code}, Error Description: ${body.error_desc}`,
                channel: body.channel,
            }, { process_status: { operator: '=', value: 'processing' }, process_worker_level: { operator: '<=', value: 1 } });

            return res.render('return', {
                data: {
                    orderId: existingOrder.order_id,
                    transactionId: body.tranID,
                    amount: existingOrder.amount,
                    transactionDate: localizedDateTime(existingOrder.created_at),
                    paymentStatus: 'failed',
                    processStatus: 'pending',
                    message: `${body.error_desc}\nWe are verifying the payment and will update your order status shortly.`
                }
            });
        }

        // Pending payment - show pending message, and waiting for the callback to confirm the final status. 
        // Setting process_status back to pending to allow the callback handler to get the order entry and update the status.
        if (body.status === "22") {
            updateOrder(existingOrder.order_id, {
                transaction_id: body.tranID,
                payment_status: PAYMENT_STATUS[body.status],
                channel: body.channel,
                process_status: 'pending',
            }, { process_status: { operator: '=', value: 'processing' }, process_worker_level: { operator: '<=', value: 1 } });

            return res.render('return', {
                data: {
                    orderId: existingOrder.order_id,
                    transactionId: body.tranID,
                    amount: existingOrder.amount,
                    paymentStatus: 'pending',
                    processStatus: 'pending',
                    transactionDate: localizedDateTime(existingOrder.created_at),
                    message: getUserMessage('pending', 'pending')
                }
            });
        }

        // For successful payment, we will show processing status as we are waiting for the callback to update the final status. 
        // This is to handle the case when user completes payment but does not return to the site or callback is delayed for some reason. 
        // We will set it to completed in callback once we update the machines.
        updateOrder(existingOrder.order_id, {
            transaction_id: body.tranID,
            payment_status: PAYMENT_STATUS[body.status],
            channel: body.channel,
            paid_on: body.paydate,
            process_status: 'processing',
        }, { process_status: { operator: '=', value: 'processing' }, process_worker_level: { operator: '<=', value: 1 } });
        
        return res.render('return', {
            data: {
                orderId: existingOrder.order_id,
                transactionId: body.tranID,
                amount: existingOrder.amount,
                paymentStatus: 'paid',
                processStatus: 'processing',
                transactionDate: localizedDateTime(existingOrder.created_at),
                message: getUserMessage('paid', 'processing'),
                machines: null // We will only show machines on the return page if the order is fully completed to avoid confusion, as we are waiting for callback to confirm final status and update machines.
            }
        });

    } catch (e) {
        logger.error('Error processing payment return:', e);
        const err = new Error('An error occurred while processing the order. If you made a payment, please contact support for assistance.');
        err.title = 'Order Processing Error';
        err.status = 500;
        return next(err);
    }
}

// Handle server-to-server payment callback and update sheets.
async function paymentCallback(req, res) {

    const body = req.body;

    if (!body || Object.keys(body).length === 0) {
        logger.warn('No data received in payment callback.');
        return res.status(400).json({ error: 'No data received.' });
    }

    const requiredFieldsCheck = checkRequiredFields(body, PAYMENT_REQUIRED_FIELDS);
    if (!requiredFieldsCheck.valid) {
        const missingField = requiredFieldsCheck.missingField;
        logger.warn(`Missing ${missingField} in payment return data:`, body);
        return res.status(400).send(`Missing required field: ${missingField}`);
    }

    // Fail closed if signature validation fails.
    if (!validateSkey(body)) {
        logger.warn('Hash verification failed for payment return:', body, 'Computed Skey:', computeSkey(body), 'Provided Skey:', body.skey);
        return res.status(400).send('Invalid data signature.');
    }

    res.status(200).send("RECEIVEDOK");

    try {
        body.amount = parseFloat(body.amount).toFixed(2);
        const existingOrder = getOrder(body.orderid);
        if (!existingOrder) {
            logger.error('Order not found for payment callback:', body.orderid);
            return;
        }

        let emailPayload;

        db.transaction(() => {

            // Concurrency checking
            const result = updateOrder(existingOrder.order_id,
                {
                    process_status: 'processing',
                    process_worker_level: 2
                },
                {
                    process_status: {
                        operator: 'IN',
                        value: ['pending', 'processing']
                    },
                    process_worker_level: {
                        operator: '<',
                        value: 2
                    }
                });
            if (result.changes === 0) {
                logger.warn('No order record updated to processing status for payment callback. Possible concurrent update or order already processed:', body.orderid);
                return;
            }

            // ----------- Handle different payment statuses and update order accordingly. -----------

            // Failed Payment
            if (body.status === "11") {
                updateOrder(existingOrder.order_id, {
                    transaction_id: body.tranID,
                    payment_status: PAYMENT_STATUS[body.status],
                    failed_remark: `Error Code: ${body.error_code}, Error Description: ${body.error_desc}`,
                    channel: body.channel,
                    process_status: 'failed',
                    paid_on: body.paydate,
                }, { process_status: { operator: '=', value: 'processing' }, process_worker_level: { operator: '<=', value: 2 } });
                return;
            }

            // Pending Payment
            if (body.status === "22") {
                updateOrder(existingOrder.order_id, {
                    transaction_id: body.tranID,
                    payment_status: PAYMENT_STATUS[body.status],
                    channel: body.channel,
                    process_status: 'pending',
                    process_worker_level: 0
                }, { process_status: { operator: '=', value: 'processing' }, process_worker_level: { operator: '<=', value: 2 } });
                return
            }

            // For successful payment,
            // Update the order record, and update end date for the machines linked to this order, and remove renewal process IDs for future renewals.
            // Finally, set process_status to completed to mark the order as fully processed.
            const orderItems = getOrderItemsByOrderId(existingOrder.order_id);
            const machineIds = orderItems.map(item => item.machine_id);
            const machines = getMachinesByIds(machineIds);
            for (const machine of machines) {
                const newEndDate = new Date(machine.end_date);
                newEndDate.setFullYear(newEndDate.getFullYear() + (machine.subscription_period))
                updateMachine(machine.id, {
                    end_date: newEndDate.toISOString(),
                    renewal_process_id: null,
                    renewal_count: machine.renewal_count + 1,
                    last_renewal_date: new Date().toISOString()
                });
            }

            // Cleaning up renewal_process_id
            updateMultipleEmailMachinesByOrderIdAndMachineIds(existingOrder.order_id, machineIds, { renewal_process_id: null });

            // Mark order process_status as completed
            updateOrder(existingOrder.order_id,
                {
                    transaction_id: body.tranID,
                    payment_status: PAYMENT_STATUS[body.status],
                    channel: body.channel,
                    process_status: 'completed',
                    paid_on: body.paydate
                },
                {
                    process_status:
                    {
                        operator: '=',
                        value: 'processing'
                    },
                    process_worker_level:
                    {
                        operator: '<=',
                        value: 2
                    }
                });

            const updatedMachines = getMachinesByIds(machineIds);
            emailPayload = {
                companyName: existingOrder.company_name,
                amount: existingOrder.amount,
                transactionDate: existingOrder.created_at,
                orderId: existingOrder.order_id,
                machines: updatedMachines
            }
        }).immediate();

        // Send the email notification to customer support after the payment and the process is successfully completed
        if (emailPayload) {
            if (existingOrder.email) {
                const customerEmailBody = customerSubscriptionRenewalSuccessTemplate(emailPayload);
                await sendEmail(existingOrder.email, "Subscription Renewal Confirmation", customerEmailBody);
            }

            const emailBody = subscriptionRenewalSuccessTemplate(emailPayload);
            await sendEmail(process.env.CS_EMAIL, "Machines Subscription Renewal", emailBody)
        }
    } catch (e) {
        logger.error('Error processing payment callback:', e, "Order ID:", body.orderid);
    } finally {
        return;
    }
}

// Render the payment cancel screen.
function paymentCancel(req, res) {
    res.render('cancel');
}

// Render a payment status check page.
function renderPaymentCheckerPage(req, res) {
    res.render('status-check', { status: null });
}

module.exports = {
    requestPayment,
    paymentReturn,
    paymentCancel,
    renderPaymentCheckerPage,
    paymentCallback
};