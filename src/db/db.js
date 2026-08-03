const Database = require("better-sqlite3");

// Initialize SQLite database with optional verbose logging in development.
const db = new Database("src/db/database.db", {
    // verbose: process.env.NODE_ENV === "development" ? console.log : null,
    verbose: null, // Disable verbose logging to prevent sensitive data exposure in logs
});

// Improve write concurrency and enforce FK constraints.
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ================== Disabled ====================

// OTP table stores per-company OTP metadata and rate limits.
// const createOTPTable = `
// CREATE TABLE IF NOT EXISTS otp (
//     id INTEGER PRIMARY KEY,
//     code_hash TEXT,
//     expires_at DATETIME NOT NULL,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     company_name TEXT NOT NULL,
//     email TEXT NOT NULL,
//     generate_blocked_until DATETIME,
//     generate_attempts INTEGER DEFAULT 1,
//     verify_blocked_until DATETIME,
//     verify_attempts INTEGER DEFAULT 0
// )`
// db.exec(createOTPTable);

// // Ensure one OTP record per company + email pair.
// const otpUniqueIndex = `
// CREATE UNIQUE INDEX IF NOT EXISTS idx_company_email ON otp (company_name, email);
// `
// db.exec(otpUniqueIndex);

// ==================================================

// Orders table tracks payment lifecycle and processing status.
const createOrderTable = `
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE,
    transaction_id TEXT,
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed')) NOT NULL DEFAULT 'pending',
    failed_remark TEXT,
    paid_on DATETIME,
    amount REAL NOT NULL,
    channel TEXT,
    customer_id INTEGER NOT NULL,
    process_status TEXT CHECK (process_status IN ('pending', 'processing', 'completed', 'failed')) NOT NULL DEFAULT 'pending',
    process_worker_level INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
)
`
db.exec(createOrderTable);

// Order items link devices to an order ID.
const orderItemsTable = `
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY,
    order_id TEXT NOT NULL,
    machine_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE RESTRICT,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE RESTRICT
)
`
db.exec(orderItemsTable);

const emailsTable = `
CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY,
    sent_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK (status IN ('sent', 'failed', 'pending')) NOT NULL DEFAULT 'sent',
    recipient_email TEXT NOT NULL,
    customer_id INTEGER NOT NULL,
    nodemailer_message_id TEXT,
    failed_reason TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
)
`
db.exec(emailsTable);

const emailMachinesTable = `
CREATE TABLE IF NOT EXISTS email_machines (
    id INTEGER PRIMARY KEY,
    machine_id INTEGER NOT NULL,
    first_email_id INTEGER NOT NULL,
    second_email_id INTEGER,
    renewal_process_id TEXT,
    order_id TEXT,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE,
    FOREIGN KEY (first_email_id) REFERENCES emails(id) ON DELETE CASCADE,
    FOREIGN KEY (second_email_id) REFERENCES emails(id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    UNIQUE(machine_id, renewal_process_id)
)
`
db.exec(emailMachinesTable);

// Customer with unique email. Disabled for now for duplicate email testing.
const customerTable = `
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY,
    company_name TEXT NOT NULL,
    company_short_name TEXT,
    email TEXT NOT NULL UNIQUE,
    contact_number TEXT NOT NULL,
    pic_name TEXT NOT NULL,
    bank_name TEXT,
    bank_account_number TEXT,
    beneficiary_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`
db.exec(customerTable);

const machineTypeTable = `
    CREATE TABLE IF NOT EXISTS machine_types (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`
db.exec(machineTypeTable);

const machineTypeFieldsTable = `
    CREATE TABLE IF NOT EXISTS machine_type_fields (
    id INTEGER PRIMARY KEY,
    machine_type_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_type_id) REFERENCES machine_types(id) ON DELETE CASCADE 
    )
`
db.exec(machineTypeFieldsTable);

const machinesTable = `
    CREATE TABLE IF NOT EXISTS machines (
    id integer PRIMARY KEY,
    machine_type_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    machine_id TEXT NOT NULL UNIQUE,
    subscription_fees REAL NOT NULL,
    subscription_period INTEGER NOT NULL DEFAULT 1 CHECK (subscription_period >= 1),
    registered_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME,
    status TEXT CHECK (status IN ('active', 'inactive')) NOT NULL DEFAULT 'active',
    renewal_count INTEGER DEFAULT 0,
    last_renewal_date DATETIME,
    data JSON,
    renewal_process_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_type_id) REFERENCES machine_types(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
`
db.exec(machinesTable);

module.exports = db;