const { getAllOrders } = require("../repositories/orderRepository");

function renderAdminOrdersPage(req, res) {

    try {
        const orders = getAllOrders();
        return res.render('admin/orders/index', { data: orders, error: null });
    } catch (e) {
        logger.error('Error rendering admin orders page:', e);
        return res.status(500).render('admin/orders/index', { data: [], error: `Failed to retrieve orders. Please try again later. Error: ${e.message || 'Unknown error'}` })
    }
}

module.exports = {
    renderAdminOrdersPage
}