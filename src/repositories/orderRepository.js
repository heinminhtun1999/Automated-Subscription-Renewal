const db = require('../db/db');

function getAllOrders() {
    const stmt = db.prepare(
        `
            SELECT o.*, c.company_name, c.id AS customer_id, m.machine_id
            FROM orders AS o
                     JOIN customers AS c ON o.customer_id = c.id
                     LEFT JOIN (SELECT m.machine_id, oi.order_id
                                FROM machines AS m
                                         JOIN order_items AS oi ON oi.machine_id = m.id) AS m ON m.order_id = o.order_id
            ORDER BY o.created_at DESC
        `
    );
    return stmt.all();
}

function getOrder(orderId) {
    const stmt = db.prepare(`
                SELECT o.*, c.company_name, c.email
                FROM orders AS o
                         LEFT JOIN customers AS c ON o.customer_id = c.id
                WHERE order_id = ?
        `
    );
    return stmt.get(orderId);
}

function getPendingOrProcessingOrders() {
    const stmt = db.prepare(
        `
            SELECT *,
                   (strftime('%s', 'now', 'localtime') - strftime('%s', created_at)) / 60.0 AS minutes_passed
            FROM orders
            WHERE process_status IN ('pending', 'processing')
              AND minutes_passed >= 5
        `
    );
    return stmt.all();
}

function insertOrder(order) {

    const fields = Object.keys(order);
    const values = Object.values(order);
    const placeholders = Array.from({ length: values.length }, _ => '?');

    const stmt = db.prepare(`
        INSERT INTO orders
            (${fields.join(',')})
        VALUES (${placeholders.join(',')})
    `);
    return stmt.run(...values);
}

function updateOrder(orderId, updateFields, additionalConditions = {}) {
    const filedCaluse = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');

    const additionalClauses = Object.keys(additionalConditions).map(key => {
        const operator = additionalConditions[key].operator || '=';
        return `${key} ${operator} ${operator === 'IN' ? `(${additionalConditions[key].value.map(() => '?').join(',')})` : '?'}`;
    }).join(' AND ');

    const whereClause = additionalClauses ? `WHERE order_id = ? AND ${additionalClauses}` : 'WHERE order_id = ?';
    const additionalConditionsValues = Object.values(additionalConditions).reduce((acc, cond) => {
        if (cond.operator === 'IN' && Array.isArray(cond.value)) {
            return [ ...acc, ...cond.value ];
        }
        return [ ...acc, cond.value ];
    }, []);

    const stmt = db.prepare(`
        UPDATE orders
        SET ${filedCaluse}
                ${whereClause}
    `);

    return stmt.run(...Object.values(updateFields), orderId, ...additionalConditionsValues);
}

module.exports = {
    getAllOrders,
    insertOrder,
    updateOrder,
    getOrder,
    getPendingOrProcessingOrders
};