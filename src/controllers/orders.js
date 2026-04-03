const { getOrder } = require('../repositories/orderRepository');

function getOrderInfo(req, res) {
    const { orderId, transactionId } = req.query;
    try {
        const order = getOrder(orderId, transactionId);
        if (order) {
            res.json({ success: true, order });
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        logger.error('Error fetching order info:', error);
        res.status(500).json({ success: false, message: 'An error occurred while fetching order information' });
    }
}

module.exports = { getOrderInfo };