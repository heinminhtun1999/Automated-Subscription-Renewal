const db = require("../db/db");

function getOTPEntry(filters) {
    const { companyName, email } = filters;

    const stmt = db.prepare(`
        SELECT * FROM otp WHERE company_name = ? AND email = ?`)
    return stmt.get(companyName, email);
}

function updateOTPEntry(companyName, email, id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    const stmt = db.prepare(`
        UPDATE otp SET ${fields} WHERE id = ? AND company_name = ? AND email = ?`);

    const info = stmt.run(...values, id, companyName, email);
    return info;
}

function insertOTPEntry(companyName, email, codeHash, expiresAt) {
    const stmt = db.prepare(`
        INSERT INTO otp (company_name, email, code_hash, expires_at) VALUES (?, ?, ?, ?)`);
    const info = stmt.run(companyName, email, codeHash, expiresAt);
    return info;
}

function deleteOTPEntry(companyName, email, id) {
    const stmt = db.prepare(
        `DELETE FROM otp WHERE id = ? AND company_name = ? AND email = ?`
    );

    const info = stmt.run(id, companyName, email);
    return info
}

module.exports = {
    getOTPEntry,
    updateOTPEntry,
    insertOTPEntry,
    deleteOTPEntry
}