const { getAllOrders } = require("../repositories/orderRepository");
const { localizedDateTime } = require("../utils/utils");
const logger = require("../utils/services/winston");

function renderAdminOrdersPage(req, res) {

    try {
        const orders = getAllOrders();
        const processedData = orders.reduce((acc, order) => {
            const isExist = Object.keys(acc).includes(order.order_id)
            if (isExist) {
                acc[order.order_id].machines.push(order.machine_id)
            } else {
                acc[order.order_id] = {
                    id: order.id,
                    order_id: order.order_id,
                    transaction_id: order.transaction_id,
                    payment_status: order.payment_status,
                    failed_remark: order.failed_remark,
                    paid_on: order.paid_on,
                    amount: order.amount,
                    channel: order.channel,
                    customer_id: order.customer_id,
                    process_status: order.process_status,
                    process_worker_level: order.process_worker_level,
                    created_at: localizedDateTime(order.created_at),
                    company_name: order.company_name,
                    machines: [order.machine_id]
                }
            }
            return acc;
        }, {});
        
        const data = Object.values(processedData)
        return res.render('admin/orders/index', { data, error: null });
    } catch (e) {
        logger.error('Error rendering admin orders page:', e);
        return res.status(500).render('admin/orders/index', { data: [], error: `Failed to retrieve orders. Please try again later. Error: ${e.message || 'Unknown error'}` })
    }
}

module.exports = {
    renderAdminOrdersPage
}