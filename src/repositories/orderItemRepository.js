const db = require('../db/db');

function getAllOrderItems() {
    const stmt = `
        SELECT * FROM order_items
    `
    return db.prepare(stmt).all();
}

function getOrderItemsByOrderId(orderId) {
    const stmt = `
        SELECT * FROM order_items
        WHERE order_id = ?
    `
    return db.prepare(stmt).all(orderId);
}

// Insert a single device line item for an order.
function insertOrderItem(orderId, machineId) {
    const stmt = `
            INSERT INTO order_items
            (order_id, machine_id) 
            VALUES (?, ?)
        `
    return db.prepare(stmt).run(orderId, machineId);
}


module.exports = { insertOrderItem, getOrderItemsByOrderId, getAllOrderItems };