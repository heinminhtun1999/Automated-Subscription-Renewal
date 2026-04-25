const db = require('../db/db');

// Insert a single device line item for an order.
function insertOrderItem(orderId, deviceId, deviceType) {
    const stmt = db.prepare(`
            INSERT INTO order_items
            (order_id, device_id, device_type) 
            VALUES (?, ?, ?)
        `)

    return stmt.run(orderId, deviceId, deviceType);
}


module.exports = { insertOrderItem };