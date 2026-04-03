const db = require('../db/db');

// Insert a single device line item for an order.
function insertOrderItem(orderId, deviceId, deviceType) {
    const stmt = db.prepare(`
            INSERT INTO order_items
            (order_id, device_id, device_type) 
            VALUES (?, ?, ?)
        `)

    const info = stmt.run(orderId, deviceId, deviceType);
    return info;
}


module.exports = { insertOrderItem };