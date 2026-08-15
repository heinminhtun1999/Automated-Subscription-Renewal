const db = require("../db/db");

function getAllEmailMachines() {
    const stmt = `
        SELECT * FROM email_machines
        WHERE renewal_process_id IS NOT NULL AND first_email_id IS NOT NULL
    `
    return db.prepare(stmt).all();
}

function getEmailMachineByRenewalProcessIds(renewalProcessIds) {
    const stmt = `
        SELECT * FROM email_machines
        WHERE renewal_process_id IN (${renewalProcessIds.map(() => "?").join(", ")})
    `
    return db.prepare(stmt).all(...renewalProcessIds);
}

function getEmailMachineByMachineId(machineId) {
    const stmt = `
        SELECT * FROM email_machines
        WHERE machine_id = ?
    `;
    return db.prepare(stmt).get(machineId);
}

function insertEmailMachine(machineId, firstEmailId, renewalProcessId) {
    const stmt = `
        INSERT INTO email_machines (machine_id, first_email_id, renewal_process_id)
        VALUES (?, ?, ?)
    `;

    return db.prepare(stmt).run(machineId, firstEmailId, renewalProcessId);
}

function updateEmailMachine(id, updateData) {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(", ");
    const values = Object.values(updateData);

    const stmt = `
        UPDATE email_machines
        SET ${fields}
        WHERE id = ?
    `;

    return db.prepare(stmt).run(...values, id);
}

function updateMultipleEmailMachinesByOrderIdAndMachineIds(orderId, machineIds, updateData) {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(", ");
    const values = Object.values(updateData);

    const stmt = `
        UPDATE email_machines
        SET ${fields}
        WHERE machine_id IN (${machineIds.map(() => "?").join(", ")}) AND order_id = ?
    `;

    return db.prepare(stmt).run(...values, ...machineIds, orderId);
}

function updateEmailMachineByMachineIdAndRenewalProcessId(machineId, renewalProcessId, updateData) {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(", ");
    const values = Object.values(updateData);

    const stmt = `
        UPDATE email_machines
        SET ${fields}
        WHERE machine_id = ? AND renewal_process_id = ?
    `;

    return db.prepare(stmt).run(...values, machineId, renewalProcessId);
}


module.exports = {
    getAllEmailMachines,
    updateEmailMachine,
    insertEmailMachine,
    getEmailMachineByMachineId,
    getEmailMachineByRenewalProcessIds,
    updateMultipleEmailMachinesByOrderIdAndMachineIds,
    updateEmailMachineByMachineIdAndRenewalProcessId,
}