const db = require("../db/db");
const logger = require('../utils/services/winston');

// Get OTP record by company and email.
function getOTPEntry(filters) {
    const { companyName, email } = filters;

    const stmt = db.prepare(`
        SELECT * FROM otp WHERE company_name = ? AND email = ?`)
    return stmt.get(companyName, email);
}

// Update OTP record by id + identity.
function updateOTPEntry(companyName, email, id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    const stmt = db.prepare(`
        UPDATE otp SET ${fields} WHERE id = ? AND company_name = ? AND email = ?`);

    const info = stmt.run(...values, id, companyName, email);
    return info;
}

// Upsert OTP record for a company/email pair.
function insertOTPEntry(companyName, email, codeHash, expiresAt) {
    const stmt = db.prepare(`
        INSERT INTO otp 
        (company_name, email, code_hash, expires_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(company_name, email) DO UPDATE SET
        code_hash = excluded.code_hash,
        expires_at = excluded.expires_at,
        generate_attempts = otp.generate_attempts + 1,
        verify_blocked_until = NULL,
        verify_attempts = 0
    `);
    const info = stmt.run(companyName, email, codeHash, expiresAt);
    return info;
}

// Delete OTP record for the provided identity.
function deleteOTPEntry(companyName, email, id) {
    const stmt = db.prepare(
        `DELETE FROM otp WHERE id = ? AND company_name = ? AND email = ?`
    );

    const info = stmt.run(id, companyName, email);
    return info
}

// Purge OTP records older than 5 minutes.
function deleteUnusedOTPs() {
    const stmt = db.prepare(
        `DELETE FROM otp WHERE ? - created_at > 300000`
    );
    const info = stmt.run(Date.now());
    return info;
}

// Periodic cleanup to keep OTP table small.
setInterval(() => {
    try {
        const info = deleteUnusedOTPs();
        logger.info(`Cleaned up unused OTPs. Rows affected: ${info.changes}`);
    } catch (e) {
        logger.error('Error occurred while cleaning up unused OTPs: ', e);
    }
}, 60000 * 60); // Run every 60 minutes

module.exports = {
    getOTPEntry,
    updateOTPEntry,
    insertOTPEntry,
    deleteOTPEntry
}