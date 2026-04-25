const db = require("../db/db");

// Fetch order by order ID (and optionally transaction ID).
function getOrder(orderId, transactionId) {
    const stmt = db.prepare(`
        SELECT * FROM orders
        WHERE order_id = ? ${transactionId ? "OR transaction_id = ?" : ""}
    `);

    let order;
    if (transactionId) {
        order = stmt.get(orderId, transactionId);
    } else {
        order = stmt.get(orderId);
    }

    return order;
}

// Fetch order plus all item rows for the order.
function getOrderWithItems(orderId, transactionId) {
    const stmtString = `
        SELECT o.*, oi.device_id, oi.device_type
        FROM orders AS o
        INNER JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.order_id = ? ${transactionId ? "OR o.transaction_id = ?" : ""}
    `;
    const stmt = db.prepare(stmtString);

    let order;
    if (transactionId) {
        order = stmt.all(orderId, transactionId);
    } else {
        order = stmt.all(orderId);
    }

    return order;
}

// Insert a new order record.
function insertOrder(order) {
    const stmt = db.prepare(`
        INSERT INTO orders 
        (order_id, amount, company_name, email, status)
        VALUES (?, ?, ?, ?, ?)
        `);
    return stmt.run(order.orderId, order.amount, order.companyName, order.email, order.status || 'pending');
}

// Update order fields with optional additional WHERE conditions.
function updateOrder(orderId, companyName, email, updateFields, additionalConditions = {}) {
    const filedCaluse = Object.keys(updateFields).
        map(key => `${key} = ?`).join(", ");

    const conditionalClause = Object.keys(additionalConditions)
        .map(key => `${key} = ?`).join(" AND ");

    const stmt = db.prepare(`
        UPDATE orders
        SET ${filedCaluse}
        WHERE order_id = ? AND company_name = ? AND email = ?
        ${conditionalClause ? " AND " + conditionalClause : ""}
    `);

    return stmt.run(...Object.values(updateFields), orderId, companyName, email, ...Object.values(additionalConditions));
}

module.exports = { insertOrder, updateOrder, getOrder, getOrderWithItems };