const db = require('../db/db');

function getAllEmails() {
    const stmt = `
        SELECT e.*, e2.sent_date AS second_email_sent_date, c.company_name, c.id AS customer_id, em.id AS email_machine_id, em.first_email_id, em.second_email_id, m.machine_id, mt.name AS machine_type_name,
        o.order_id, o.payment_status, o.process_status
        FROM emails AS e
        JOIN customers AS c ON e.customer_id = c.id
        LEFT JOIN email_machines AS em ON em.first_email_id = e.id
        LEFT JOIN emails AS e2 ON e2.id = em.second_email_id
        LEFT JOIN orders AS o ON o.order_id = em.order_id
        LEFT JOIN machines AS m on m.id = em.machine_id
        LEFT JOIN machine_types AS mt ON m.machine_type_id = mt.id
        ORDER BY e.sent_date DESC
    `
    return db.prepare(stmt).all();
}

function insertEmail(recipientEmail, customerId, status) {
    const stmt = `
        INSERT INTO emails (recipient_email, customer_id, status)
        VALUES (?, ?, ?)
    `
    return db.prepare(stmt).run(recipientEmail, customerId, status);
}

function updateEmail(id, updateData) {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(", ");
    const values = Object.values(updateData);
    const stmt = `
        UPDATE emails SET 
        ${fields}
        WHERE id = ?
    `
    return db.prepare(stmt).run(...values, id);
}

module.exports = {
    getAllEmails,
    insertEmail,
    updateEmail
}