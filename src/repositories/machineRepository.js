const db = require("../db/db");

function getMachinesByTypeDB(typeId) {
    const stmt = `
        SELECT m.*, c.company_name, c.pic_name, mt.name AS machine_type_name
        FROM machines AS m
        JOIN machine_types AS mt ON m.machine_type_id = mt.id
        JOIN customers AS c ON m.customer_id = c.id
        WHERE m.machine_type_id = ?
        ORDER BY m.created_at, m.registered_date DESC
    `
    return db.prepare(stmt).all(typeId);
}

function getMachineByMachineIdOrId(id, machineId) {
    const stmt = `
        SELECT m.*, c.company_name, c.pic_name, mt.name AS machine_type_name
        FROM machines AS m
        JOIN machine_types AS mt ON m.machine_type_id = mt.id
        JOIN customers AS c ON m.customer_id = c.id
        WHERE m.machine_id = ? OR m.id = ?
        ORDER BY m.created_at, m.registered_date DESC
    `
    return db.prepare(stmt).get(id, id);
}

function getMachineById(id) {
    const stmt = `
        SELECT m.*, c.company_name, c.pic_name, mt.name AS machine_type_name
        FROM machines AS m
        JOIN machine_types AS mt ON m.machine_type_id = mt.id
        JOIN customers AS c ON m.customer_id = c.id
        WHERE m.id = ?
        ORDER BY m.created_at, m.registered_date DESC
    `
    return db.prepare(stmt).get(id);
}

function getMachinesByIds(ids) {
    const stmt = `
        SELECT m.*, c.company_name, c.pic_name, mt.name AS machine_type_name
        FROM machines AS m
        JOIN machine_types AS mt ON m.machine_type_id = mt.id
        JOIN customers AS c ON m.customer_id = c.id
        WHERE m.id IN (${ids.map(() => "?").join(", ")})
    `;
    return db.prepare(stmt).all(...ids);
}

function getMachineByDaysLeft(daysLeft, includeExpired = false, active, customer) {
    const stmt = `
        SELECT m.*, c.id AS customer_id, c.company_name, c.pic_name, c.email, mt.name AS machine_type_name, 
        julianday(m.end_date) - julianday('now') AS days_left
        FROM machines AS m
        JOIN machine_types AS mt ON m.machine_type_id = mt.id
        JOIN customers AS c ON m.customer_id = c.id
        WHERE ${includeExpired ? "" : "days_left > 0 AND"} days_left <= ? ${active ? 'AND m.status = ?' : ''}
    `
    if (active) {
        return db.prepare(stmt).all(daysLeft, active);
    } else {
        return db.prepare(stmt).all(daysLeft);
    }
}

function getMachineByDaysLeftAndCustomerId(daysLeft, customerId, includeExpired = false) {
    const stmt = `
        SELECT m.*, c.id AS customer_id, c.company_name, c.pic_name, c.email, mt.name AS machine_type_name,
        julianday(m.end_date) - julianday('now') AS days_left
        FROM machines AS m
        JOIN machine_types AS mt ON m.machine_type_id = mt.id
        JOIN customers AS c ON m.customer_id = c.id
        WHERE c.id = ? AND ${includeExpired ? "" : "days_left > 0 AND"} julianday(m.end_date) - julianday('now') <= ?
    `
    return db.prepare(stmt).all(customerId, daysLeft);
}

function addMachine(machineData) {

    const fields = Object.keys(machineData).map(key => `${key}`).join(", ");
    const values = Object.values(machineData);

    const stmt = `
        INSERT INTO machines (${fields})
        VALUES (${Array.from({ length: values.length }, () => "?").join(", ")})
    `;
    return db.prepare(stmt).run(...values);
}

function updateMachine(id, machineData) {

    const fields = Object.keys(machineData).map(key => `${key} = ?`).join(", ");
    const values = Object.values(machineData);

    const stmt = `
        UPDATE machines
        SET ${fields}
        WHERE id = ?
    `;
    return db.prepare(stmt).run(...values, id);
}

function updateMultipleMachines(ids, updateData) {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(", ");
    const values = Object.values(updateData);

    const stmt = `
        UPDATE machines
        SET ${fields}
        WHERE id IN (${ids.map(() => "?").join(", ")})
    `

    return db.prepare(stmt).run(...values, ...ids)
}

function updateMultipleMachinesByCases(ids, machineData) {
    const fields = Object.keys(machineData).map(key => {
        return `${key} = CASE
            ${Array.from({ length: machineData[key].length }, _ => `WHEN id = ? THEN ?`).join("\n")}\nEND`
    });

    const values = Object.values(machineData).reduce((acc, a) => [...acc, ...a.reduce((acc, b) => [...acc, ...b], [])], []);

    const stmt = `
        UPDATE machines
        SET ${fields.join(",")}
        WHERE id IN (${ids.map(() => "?").join(", ")})
    `

    return db.prepare(stmt).run(...values, ...ids);
}

function deleteMachine(id) {
    const stmt = db.prepare(`DELETE FROM machines WHERE id = ?`);
    return stmt.run(id);
}

function deleteMachinesByMachineType(machineTypeId) {
    const stmt = db.prepare(`DELETE FROM machines WHERE machine_type_id = ?`);
    return stmt.run(machineTypeId);
}

module.exports = {
    getMachinesByTypeDB,
    getMachineByMachineIdOrId,
    updateMachine,
    addMachine,
    deleteMachine,
    getMachineByDaysLeft,
    getMachineByDaysLeftAndCustomerId,
    getMachinesByIds,
    updateMultipleMachinesByCases,
    updateMultipleMachines,
    deleteMachinesByMachineType
}