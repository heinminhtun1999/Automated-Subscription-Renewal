const Database = require("better-sqlite3");

const db = new Database("src/db/database.db", {
    verbose: process.env.NODE_ENV === "development" ? console.log : null,
});

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const createOTPTable = `
CREATE TABLE IF NOT EXISTS otp (
    id INTEGER PRIMARY KEY,
    code_hash TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    company_name TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    generate_blocked_until DATETIME,
    generate_attempts INTEGER DEFAULT 1,
    verify_blocked_until DATETIME,
    verify_attempts INTEGER DEFAULT 0
)`

db.exec(createOTPTable);

module.exports = db;