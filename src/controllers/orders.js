const { getOrder, insertOrder } = require('../repositories/orderRepository');
const { getOrderItemsByOrderId, insertOrderItem } = require('../repositories/orderItemRepository');
const { getMachineByMachineIdOrId, getMachinesByIds, updateMachine } = require('../repositories/machineRepository');
const { updateEmailMachineByMachineIdAndRenewalProcessId } = require('../repositories/emailMachinesRepository');
const { getUserMessage } = require('../utils/dataProcessors');
const { checkRequiredFields, localizedDateTime } = require('../utils/utils');
const { MAX_RENEWAL_ALLOWED_MONTHS } = require('../utils/constants');
const db = require('../db/db');
const logger = require('../utils/services/winston');

// Function to get order status and information
// This is used by /check-status and in payment return pooling
function getOrderInfo(req, res) {
    const { orderId } = req.query;
    try {
        const order = getOrder(orderId);
        if (order) {
            let failedRemark = order.failed_remark;
            failedRemark = failedRemark ? failedRemark.split(',').filter(m => m.includes('Error Description')).join('').replace('Error Description: ', 'Reason: ') : '';
            order.failed_remark = failedRemark.replace('Reason: ', '');
            order.create_at = localizedDateTime(order.create_at);
            const message = getUserMessage(order.payment_status, order.process_status) + `\n${failedRemark}`;
            if (order.payment_status === 'paid' && order.process_status === 'completed') {
                const orderItems = getOrderItemsByOrderId(orderId);
                const machineIds = orderItems.map(item => item.machine_id);
                const machines = getMachinesByIds(machineIds);
                return res.status(200).json({ success: true, order, machines, message });
            } else {
                return res.status(200).json({ success: true, order, machines: [], message });
            }
        } else {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        logger.error('Error fetching order info:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while fetching order information.' });
    }
}

function addManualRenewalRecord(req, res) {

    const requiredFields = [ 'paid_date', 'amount', 'machine_id' ];
    const requiredFieldCheck = checkRequiredFields(req.body, requiredFields);
    if (!requiredFieldCheck.valid) {
        const missingField = requiredFieldCheck.missingField;
        logger.warn(`Missing ${missingField} in handleAddMachine:`, req.body);
        return res.status(400).json({ success: false, message: `Missing required field: ${missingField}` });
    }

    const { paid_date, payment_method, extend_period, amount, machine_id } = req.body;

    if (amount < 0) {
        return res.status(400).json({ success: false, message: 'Amount must be larger than or equal to 0.' });
    }

    const isValidRenewedDate = !isNaN((new Date(paid_date)).getTime());
    if (!isValidRenewedDate) {
        return res.status(400).json({ success: false, message: 'Incorrect paid date.' });
    }

    try {

        const machine = getMachineByMachineIdOrId(machine_id);
        if (!machine) {
            return res.status(404).json({ success: false, message: 'Machine not found.' });
        }

        try {

            // Checking to decide whether the end date should be extended from the end_date from database, or extended from current date
            // Logic: if the machine has expired beyond allowed max time frame, it will extend from the current date, otherwise use from database
            const date = new Date();
            const machineEndDate = new Date(machine.end_date);

            const todayAndEndDateMonthsDifference = (date.getFullYear() - machineEndDate.getFullYear()) * 12 + date.getMonth() - machineEndDate.getMonth();

            const newEndDate = todayAndEndDateMonthsDifference > MAX_RENEWAL_ALLOWED_MONTHS ? date : machineEndDate;
            newEndDate.setFullYear(newEndDate.getFullYear() + Number(extend_period || machine.subscription_period));

            const randomNumber = Math.floor(Math.random() * 10000);
            const orderId = `${date.getTime()}${randomNumber}`;
            const orderBody = {
                order_id: orderId,
                amount: amount ?? machine.subscription_fees,
                payment_status: 'paid',
                process_status: 'completed',
                paid_on: paid_date,
                channel: payment_method,
                customer_id: machine.customer_id,
                process_worker_level: 2,
                payment_type: 'EXTERNAL/MANUAL'
            };

            db.transaction(() => {
                updateMachine(machine.id, {
                    end_date: newEndDate.toISOString(),
                    renewal_process_id: null,
                    status: 'active',
                    renewal_count: machine.renewal_count + 1,
                    last_renewal_date: new Date(paid_date).toISOString()
                });

                updateEmailMachineByMachineIdAndRenewalProcessId(machine.machine_id, machine.renewal_process_id,
                    {
                        renewal_process_id: null,
                        order_id: orderId
                    }
                );

                insertOrder(orderBody);

                insertOrderItem(orderId, machine.id);
            }).immediate();

        } catch (e) {
            logger.error(`Error adding manual renewal record (or) updating machine end date. Error: ${e.message}`);
            return res.status(500).json({
                success: false,
                message: 'Error occurred while adding manual renewal record.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Record has been successfully added to the orders.'
        });

    } catch (error) {
        logger.error('Unexpected error adding new manual renewal record.', error);
        return res.status(500).json({
            success: false,
            message: `An unexpected error occurred. Error: ${error.message}`
        });
    }
}

module.exports = { getOrderInfo, addManualRenewalRecord };