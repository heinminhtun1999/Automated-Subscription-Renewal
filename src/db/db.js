const Database = require("better-sqlite3");

// Initialize SQLite database with optional verbose logging in development.
const db = new Database("src/db/database.db", {
    verbose: process.env.NODE_ENV === "development" ? console.log : null,
});

// Improve write concurrency and enforce FK constraints.
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// OTP table stores per-company OTP metadata and rate limits.
const createOTPTable = `
CREATE TABLE IF NOT EXISTS otp (
    id INTEGER PRIMARY KEY,
    code_hash TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    company_name TEXT NOT NULL,
    email TEXT NOT NULL,
    generate_blocked_until DATETIME,
    generate_attempts INTEGER DEFAULT 1,
    verify_blocked_until DATETIME,
    verify_attempts INTEGER DEFAULT 0
)`
db.exec(createOTPTable);

// Ensure one OTP record per company + email pair.
const otpUniqueIndex = `
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_email ON otp (company_name, email);
`
db.exec(otpUniqueIndex);

// Orders table tracks payment lifecycle and processing status.
const createOrderTable = `
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE,
    transaction_id TEXT,
    status TEXT CHECK (status IN ('pending', 'paid', 'failed')) NOT NULL DEFAULT 'pending',
    failed_remark TEXT,
    paid_on DATETIME,
    amount REAL NOT NULL,
    channel TEXT,
    company_name TEXT NOT NULL,
    email TEXT NOT NULL,
    process_status TEXT CHECK (process_status IN ('pending', 'processing', 'completed')) NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`
db.exec(createOrderTable);

// Order items link devices to an order ID.
const orderItemsTable = `
    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY,
        order_id TEXT NOT NULL,
        device_id TEXT NOT NULL,
        device_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE RESTRICT
    )
`
db.exec(orderItemsTable);

module.exports = db;