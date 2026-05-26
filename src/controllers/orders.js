const { getOrder } = require('../repositories/orderRepository');
const { getOrderItemsByOrderId } = require("../repositories/orderItemRepository");
const { getMachinesByIds } = require("../repositories/machineRepository");
const { getUserMessage } = require("../utils/dataProcessors");
const logger = require('../utils/services/winston');

// Function to get order status and information
// This is used by /check-status and in payment return pooling
function getOrderInfo(req, res) {
    const { orderId } = req.query;
    try {
        const order = getOrder(orderId);
        if (order) {
            let failedRemark = order.failed_remark;
            failedRemark = failedRemark ? failedRemark.split(",").filter(m => m.includes("Error Description")).join("").replace("Error Description: ", "Reason: ") : "";
            order.failed_remark = failedRemark.replace("Reason: ", "");
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
        return res.status(500).json({ success: false, message: 'An error occurred while fetching order information' });
    }
}

module.exports = { getOrderInfo };