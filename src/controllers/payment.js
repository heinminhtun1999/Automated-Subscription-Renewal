const { uid } = require("../utils/dataProcessors");
const { SHEET_CONFIGS, PAYMENT_STATUS, PAYMENT_REQUIRED_FIELDS } = require("../utils/constants");
const { preparePaymentBody } = require("../utils/services/fiuu");
const { redirectTemplate } = require("../utils/htmlTemplates");
const { insertOrder, updateOrder, getOrder, getOrderWithItems } = require("../repositories/orderRepository");
const { insertOrderItem } = require("../repositories/orderItemRepository");
const { validateSkey, checkRequiredFields } = require("../utils/utils");
const { getGroupedData, updateCellValue } = require("../utils/services/sheets");
const logger = require("../utils/services/winston");
const db = require("../db/db");

// Build payment request, persist order + items, and redirect to gateway.
async function requestPayment(req, res, next) {

    const { terminalIds, companyName } = req.body;

    if (!req.session) {
        const err = new Error('Session not found. Please refresh the page and try again.');
        err.status = 400;
        return next(err);
    }

    const user = req.session.users ? req.session.users[companyName] : null;
    if (!user) {
        const err = new Error('User session not found. Please refresh the page and try again.');
        err.status = 400;
        return next(err);
    }

    // Allow bypass in development, enforce OTP in production.
    const isVerified = process.env.NODE_ENV === 'development' ? true : user.isVerified;
    if (!isVerified) {
        const err = new Error('Unauthorized. Please refresh the page and complete OTP verification to proceed with payment.');
        err.status = 401;
        return next(err);
    }

    const data = user.data;
    if (!data) {
        const err = new Error('Requested data not found. Please refresh the page and try again.\nIf the issue persists, contact support.');
        err.status = 400;
        return next(err);
    }

    // Map sheet rows to selected devices and normalize fields.
    const selectedTerminals = data.map(item => {
        return {
            deviceId: uid(item),
            deviceType: item['Sheet Name'],
            renewalFee: item['Renewal Fee (RM)'].value || 0,
        }
    }).filter(item => terminalIds.includes(item.deviceId));

    if (selectedTerminals.length === 0) {
        const err = new Error('No valid terminals selected. Please select at least one terminal and try again.');
        err.status = 400;
        return next(err);
    }

    // Sum fees for payment amount.
    const total = selectedTerminals.reduce((sum, terminal) => sum + parseFloat(terminal.renewalFee), 0).toFixed(2);

    try {

        const bodyData = {
            beneficiaryName: data[0]['Beneficiary Name'].value,
            email: data[0]['Email Address'].value,
            contactNumber: data[0]['Contact Number'].value,
            companyName,
            total: total
        }

        const baseURL = req.protocol + '://' + req.get('host');

        const paymentBody = preparePaymentBody(bodyData, baseURL);

        const orderInfo = {
            orderId: paymentBody.orderid,
            companyName,
            amount: bodyData.total,
            email: bodyData.email,
            status: 'pending'
        }

        // Atomically insert order and items.
        db.transaction((orderInfo, terminals) => {
            insertOrder(orderInfo);
            for (const terminal of terminals) {
                insertOrderItem(
                    orderInfo.orderId,
                    terminal.deviceId,
                    terminal.deviceType
                );
            }
        }).immediate(orderInfo, selectedTerminals);

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

    const processingPayload = {
        tranID: body.tranID,
        orderid: body.orderid,
        amount: body.amount,
        status: 'processing',
    }

    const requiredFieldsCheck = checkRequiredFields(body, PAYMENT_REQUIRED_FIELDS);
    if (!requiredFieldsCheck.valid) {
        const missingField = requiredFieldsCheck.missingField;
        logger.warn(`Missing ${missingField} in payment return data:`, body);
        if (missingField === "orderid" || missingField === "tranID") {
            const err = new Error('Order ID or Transaction ID missing in payment data from payment provider. If you have completed the payment, please contact support with your order information for assistance.');
            err.title = 'Order Processing Error';
            err.status = 400;
            return next(err);
        } else {
            return res.render('return', { data: processingPayload });
        }
    }

    // Fail closed if signature validation fails.
    if (!validateSkey(body)) {
        logger.warn('Hash verification failed for payment return:', body);
        return res.render('return', { data: processingPayload });
    }

    try {
        const existingOrder = getOrder(body.orderid, body.tranID);

        if (!existingOrder) {
            logger.error('Order not found for payment return:', body.orderid);
            return res.render('return', {
                data: {
                    orderId: body.orderid,
                    amount: body.amount,
                    transactionId: body.tranID,
                    status: 'error',
                    message: 'Order not found. If you have completed the payment, please contact support with your order information for assistance.',
                }
            });
        }

        const payload = {
            orderId: existingOrder.order_id,
            amount: existingOrder.amount,
            transactionId: body.tranID,
            status: existingOrder.process_status == 'processing' ? 'processing' : existingOrder.status,
        };

        res.render('return', { data: payload });

    } catch (e) {
        logger.error('Error processing payment return:', e);
        const err = new Error('An error occurred while processing the payment return. Please contact support with your order information for assistance.');
        err.title = 'Order Processing Error';
        err.status = 500;
        return next(err);
    }
}

// Handle server-to-server payment callback and update sheets.
async function paymentCallback(req, res) {
    const body = req.body;

    if (!body || Object.keys(body).length === 0) {
        return res.status(400).send('No data received');
    }

    const requiredFieldsCheck = checkRequiredFields(body, PAYMENT_REQUIRED_FIELDS);
    if (!requiredFieldsCheck.valid) {
        return res.status(400).send(`Missing required field: ${requiredFieldsCheck.missingField}`);
    }

    if (!validateSkey(body)) {
        return res.status(400).send('Invalid data signature');
    }

    res.status(200).send('Success OK');

    let existingOrder;
    const updatedRows = [];

    try {
        existingOrder = getOrderWithItems(body.orderid, body.tranID);

        if (existingOrder.length === 0) {
            logger.error('Order not found for payment callback:', body.orderid);
            return;
        }

        // Flatten order rows into a single order with device list.
        existingOrder = existingOrder.reduce((acc, item) => {
            const data = {
                ...acc,
                devices: [
                    ...acc.devices,
                    {
                        deviceId: item.device_id,
                        deviceType: item.device_type
                    }
                ]
            }
            delete data.device_id;
            delete data.device_type;
            return data;
        }, { ...existingOrder[0], devices: [] });

        const processingStatus = existingOrder.process_status;
        if (processingStatus === "completed" || processingStatus === "processing") {
            return;
        }

        const status = PAYMENT_STATUS[body.status];
        const updateData = {
            status,
            transaction_id: body.tranID,
            paid_on: body.paydate,
            channel: body.channel,
            process_status: 'processing',
            failed_remark: body.error_code || body.error_desc ? `Error Code: ${body.error_code}, Error Description: ${body.error_desc}` : null
        }

        updateOrder(existingOrder.order_id, existingOrder.company_name, existingOrder.email, updateData, { process_status: 'pending' });

        const groupedData = await getGroupedData(true, ["firstEmailNotNotified", "firstEmailNotified"]);
        const companyData = groupedData[existingOrder.company_name];

        const filteredTerminals = [];
        for (const device of existingOrder.devices) {
            const matchedTerminal = companyData.find(item => uid(item) === device.deviceId && item['Sheet Name'] === device.deviceType);
            filteredTerminals.push(matchedTerminal);
        }

        for (const terminal of filteredTerminals) {
            const dateNames = SHEET_CONFIGS.filter(config => config.sheetKey == terminal['Sheet Name'])[0];
            const endDate = terminal[dateNames.endDateColumn];
            const renewalEndDate = terminal[dateNames.renewalEndDateColumn];

            const affectedRow = {
                recipient: terminal
            };

            let result;
            // Prefer renewal end date; fallback to end date if missing.
            if (renewalEndDate && new Date(renewalEndDate)) {
                affectedRow.oldValue = renewalEndDate.value;
                affectedRow.dateType = dateNames.renewalEndDate;

                const newDate = new Date(renewalEndDate.value);
                newDate.setFullYear(newDate.getFullYear() + 1);
                result = updateCellValue(dateNames.renewalEndDateColumn, terminal, newDate.toISOString().split('T')[0]);
            } else if (endDate && new Date(endDate)) {
                affectedRow.oldValue = endDate.value;
                affectedRow.dateType = dateNames.endDate;

                const newDate = new Date(endDate.value);
                newDate.setFullYear(newDate.getFullYear() + 1);
                result = updateCellValue(dateNames.endDateColumn, terminal, newDate.toISOString().split('T')[0]);
            } else {
                throw new Error(`Sheet Error: No valid date found for terminal ${terminal['Company Name'].value} - ${terminal['Sheet Name']} - ${uid(terminal)}. Manual intervention required to update the renewal date.`);
            }

            if (result.ok) {
                updatedRows.push(affectedRow);
            } else {
                throw new Error(`Sheet Error: renewal date update failed,\n${result.error}`);
            }
        }

        updateOrder(existingOrder.order_id, existingOrder.company_name, existingOrder.email, { process_status: 'completed' }, { process_status: 'processing' });

    } catch (e) {

        if (existingOrder) {
            try {
                const rollbackData = {
                    status: 'pending',
                    transaction_id: null,
                    paid_on: null,
                    channel: null,
                    process_status: 'pending',
                    failed_remark: null
                };
                updateOrder(existingOrder.order_id, existingOrder.company_name, existingOrder.email, { ...existingOrder });
            } catch (dbUpdateRollBackError) {
                logger.error('Critical Error: Failed to roll back order after callback processing failure:', dbUpdateRollBackError);
            }
        }

        if (updatedRows.length > 0) {
            for (const row of updatedRows) {
                try {
                    const rollbackResult = updateCellValue(row.dateType, row.recipient, row.oldValue);
                    if (!rollbackResult.ok) {
                        logger.error(`Critical Error: Failed to roll back sheet update for ${row.recipient['Company Name'].value} - ${row.recipient['Sheet Name']} - ${uid(row.recipient)}:`, rollbackResult.error);
                    }
                } catch (rollbackError) {
                    logger.error(`Critical Error: Failed to roll back sheet update for ${row.recipient['Company Name'].value} - ${row.recipient['Sheet Name']} - ${uid(row.recipient)}:`, rollbackError);

                }
            }
        }
        return;
    }


}

// Render the payment cancel screen.
function paymentCancel(req, res) {
    res.render('cancel');
}

// Render a payment status check page.
function renderPamentCheckerPage(req, res) {
    res.render('status-check', { status: null });
}

module.exports = {
    requestPayment,
    paymentReturn,
    paymentCancel,
    renderPamentCheckerPage,
    paymentCallback
};