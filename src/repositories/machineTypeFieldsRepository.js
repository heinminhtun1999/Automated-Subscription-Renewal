const db = require("../db/db");

function getMachineTypeFields(machineTypeId) {
    const stmt = db.prepare(
        `SELECT id, name
        FROM machine_type_fields
        WHERE machine_type_id = ?`
    )
    return stmt.all(machineTypeId);
}

function addMachineTypeFieldDB(machineTypeId, fieldName) {
    const stmt = db.prepare(
        `
        INSERT INTO machine_type_fields (machine_type_id, name)
        VALUES (?, ?)
        `
    )
    return stmt.run(machineTypeId, fieldName);
}

function updateMachineTypeFields(machineTypeId, data) {
    const { field_id, name } = data;

    const stmt = db.prepare(
        `
        UPDATE machine_type_fields
        SET name = ?
        WHERE machine_type_id = ? AND id = ?
        `
    )

    return stmt.run(name, machineTypeId, field_id);
}

function deleteMachineTypeField(machineTypeId, fieldId) {
    const stmt = db.prepare(
        `
        DELETE FROM machine_type_fields
        WHERE machine_type_id = ? AND id = ?
        `);

    return stmt.run(machineTypeId, fieldId);
}

function deleteMachineTypeFieldByMachineType(machineTypeId) {
    const stmt = db.prepare(`DELETE FROM machine_type_fields WHERE machine_type_id = ?`);
    return stmt.run(machineTypeId);
}

module.exports = {
    addMachineTypeFieldDB,
    getMachineTypeFields,
    updateMachineTypeFields,
    deleteMachineTypeField,
    deleteMachineTypeFieldByMachineType
}