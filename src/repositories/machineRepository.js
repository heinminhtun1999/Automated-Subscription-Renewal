const db = require("../db/db");

function getMachinesByTypeDB(typeId) {
    const stmt = `
        SELECT m.*, c.company_name, c.pic_name, mt.name AS machine_type_name
        FROM machines AS m
        JOIN machine_types AS mt ON m.machine_type_id = mt.id
        JOIN customers AS c ON m.company_id = c.id
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
        JOIN customers AS c ON m.company_id = c.id
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
        JOIN customers AS c ON m.company_id = c.id
        WHERE m.machine_id = ?
        ORDER BY m.created_at, m.registered_date DESC
    `
    return db.prepare(stmt).get(id);
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

function updateMachine(machineId, machineData) {

    const fields = Object.keys(machineData).map(key => `${key} = ?`).join(", ");
    const values = Object.values(machineData);

    const stmt = `
        UPDATE machines
        SET ${fields}
        WHERE id = ?
    `;
    return db.prepare(stmt).run(...values, machineId);
}

function deleteMachine(machineId) {
    const stmt = db.prepare(`DELETE FROM machines WHERE id = ?`);
    return stmt.run(machineId);
}

module.exports = {
    getMachinesByTypeDB,
    getMachineByMachineIdOrId,
    updateMachine,
    addMachine,
    deleteMachine
}