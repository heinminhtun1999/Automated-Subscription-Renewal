const db = require('../db/db');

// Fetch all companies with their latest email and device info.
function getAllCustomers() {
    const query = `
        SELECT * 
        FROM customers 
        ORDER BY created_at DESC
    `;
    return db.prepare(query).all();
}

function getCustomerById(customerId) {
    const stmt = `
        SELECT * FROM customers WHERE id = ?
    `;
    return db.prepare(stmt).get(customerId);
}

function getCustomerByIdWithMachines(customerId) {
    const stmt = `
        SELECT c.*, m.id AS m_id, m.machine_id, m.status, m.end_date, mt.name AS machine_type
        FROM customers c
        LEFT JOIN machines m ON c.id = m.company_id
        LEFT JOIN machine_types mt ON m.machine_type_id = mt.id
        WHERE c.id = ?
    `;
    return db.prepare(stmt).all(customerId);
}

function getCustomerByEmail(email) {
    const stmt = `
        SELECT * FROM customers WHERE email = ?
    `;
    return db.prepare(stmt).get(email);
}

function addCustomer(customerData) {
    const fields = Object.keys(customerData).map(key => `${key}`).join(", ");
    const values = Object.values(customerData);
    const stmt = db.prepare(`
        INSERT INTO customers (${fields})
        VALUES (${Array.from({ length: values.length }, () => "?").join(", ")})
    `);
    return stmt.run(...values);
}

function updateCustomer(customerId, customerData) {
    const fields = Object.keys(customerData).map(key => `${key} = ?`).join(", ");
    const values = Object.values(customerData);
    const stmt = db.prepare(`
        UPDATE customers SET ${fields} WHERE id = ?
    `);
    return stmt.run(...values, customerId);
}

function deleteCustomer(customerId) {
    const stmt = `
        DELETE FROM customers WHERE id = ?
    `;
    return db.prepare(stmt).run(customerId)
}

module.exports = {
    getAllCustomers,
    getCustomerById,
    getCustomerByIdWithMachines,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerByEmail
};