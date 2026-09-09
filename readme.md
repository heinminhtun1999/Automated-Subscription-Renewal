# Automated Subscription Renewal (ASR) — Project Documentation

> Last updated: September 2026
> Stack: Node.js, Express, SQLite, EJS, Tailwind CSS

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Environment Variables](#4-environment-variables)
5. [Database Schema](#5-database-schema)
6. [Architecture Overview](#6-architecture-overview)
7. [Core Flows](#7-core-flows)
   - [Reminder Email Flow](#71-reminder-email-flow)
   - [Payment Flow](#72-payment-flow)
   - [Reconciliation Flow](#73-reconciliation-flow)
8. [Background Jobs](#8-background-jobs)
9. [API Endpoints](#9-api-endpoints)
10. [Admin Panel](#10-admin-panel)
11. [Middlewares](#11-middlewares)
12. [Services](#12-services)
13. [Backup System](#13-backup-system)
14. [Deployment](#14-deployment)
15. [CI/CD Pipeline](#15-cicd-pipeline)
16. [Known Limitations & Future Work](#16-known-limitations--future-work)

---

## 1. Project Overview

Automated Subscription Renewal is an internal web application built for **AR Vending** to automate the subscription renewal process for vending machines.

1. The system detects machines nearing their subscription expiry
2. It sends a reminder email to the customer with a unique renewal link
3. The customer selects which machines to renew and proceeds to payment
4. The payment gateway (Fiuu) processes the transaction
5. On successful payment, machine subscription dates are automatically extended by each machine's configured subscription period
6. A confirmation email is sent to customer service

The system also has a full **admin panel** for managing customers, machines, machine types, orders, and email history.

The public home page is available at `/` and provides an overview of the renewal service with a direct link to the payment status checker at `/status-check`.

---

## 2. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Runtime | Node.js | JavaScript backend |
| Framework | Express v5 | Web server and routing |
| Database | SQLite (better-sqlite3) | Simple, file-based, no separate DB server needed |
| Templating | EJS | Server-side rendered HTML views |
| CSS | Tailwind CSS | Utility-first styling |
| Email | Nodemailer | SMTP email sending |
| Payment Gateway | Fiuu (formerly Razer Pay) | Malaysian payment gateway |
| Process Manager | PM2 | Keep app running, manage multiple processes |
| Logging | Winston + Daily Rotate | Structured logging with file rotation |
| Scheduling | node-cron | Cron job scheduling |
| Cloud Backup | Backblaze B2 (S3-compatible) | Offsite database backup |
| Auth (Admin) | bcrypt + express-session | Password hashing and session management |
| Auth (Customer) | JWT | Signed URLs for customer machine selection |

---

## 3. Directory Structure

```
Automated-Subscription-Renewal/
├── migrations/                     # Incremental database schema changes
├── public/                         # Static assets served directly
│   ├── css/                        # Page-specific stylesheets
│   │   ├── home.css                # Public landing page styles
│   │   └── ...
│   ├── js/                         # Client-side JavaScript
│   └── images/                     # Logo and icons
├── scripts/                        # One-time utility scripts (not part of app)
├── src/
│   ├── controllers/                # Route handlers and business logic
│   ├── db/                         # Database initialization
│   ├── jobs/                       # Background jobs
│   ├── middlewares/                # Authentication and origin checks
│   ├── repositories/               # Database query functions
│   ├── utils/                      # Shared helpers, templates, and services
│   ├── views/                      # EJS templates
│   │   ├── admin/                  # Admin panel pages
│   │   ├── partials/               # Shared layout components
│   │   ├── home.ejs                # Public landing page
│   │   ├── machines.ejs            # Customer machine selection page
│   │   ├── return.ejs              # Post-payment return page
│   │   ├── status-check.ejs        # Payment status checker
│   │   ├── cancel.ejs              # Payment cancelled page
│   │   └── error.ejs               # Error page
│   └── index.js                    # App entry point and route definitions
├── logs/                           # Winston log output (auto-generated)
├── ecosystem.config.js             # PM2 process configuration
├── package.json
└── .env                            # Environment variables
```

---

## 4. Environment Variables

Create a `.env` file in the project root. All variables below are required unless marked optional.

```env
# Application
NODE_ENV=development            # "development" or "production"
PORT=4000
PUBLIC_BASE_URL=https://yourdomain.com

# Admin Authentication
ADMIN_PASSWORD_HASH=            # bcrypt hash of admin password
SESSION_SECRET=                 # Random string for session signing

# JWT (for customer machine selection links)
JWT_SECRET=                     # Random string for JWT signing

# Email (SMTP)
smtpHost=
smtpPort=465
smtpUsername=
smtpPassword=
CS_EMAIL=                       # Customer service email (receives alerts)
DEV_EMAIL=                      # Developer email (receives critical alerts)

# Fiuu Payment Gateway
merchantID=
secretKey=
verifyKey=
RECONCILIATION_URL=             # Fiuu reconciliation API endpoint

# Backblaze B2 Backup
B2_KEY_ID=
B2_SECRET_ACCESS_KEY=
B2_END_POINT=                   # e.g. https://s3.us-west-004.backblazeb2.com
B2_REGION=                      # e.g. us-west-004
B2_BUCKET_NAME=                 # Backblaze bucket name
```

### Generating the admin password hash

Run this once in Node.js to generate bcrypt hash:

```js
const bcrypt = require('bcrypt');
bcrypt.hash('password-here', 10).then(console.log);
```

Paste the output into `ADMIN_PASSWORD_HASH` in `.env`.

---

## 5. Database Schema

The database is initialized automatically when the app starts. Tables are created with `CREATE TABLE IF NOT EXISTS` in `src/db/db.js`.

### `customers`
Stores the companies that own machines.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| company_name | TEXT | Required |
| company_short_name | TEXT | Optional |
| email | TEXT UNIQUE | Required — used for sending reminders |
| contact_number | TEXT | Required |
| pic_name | TEXT | Person in charge name |
| bank_name | TEXT | Optional |
| bank_account_number | TEXT | Optional |
| beneficiary_name | TEXT | Used in payment request |
| created_at | DATETIME | Auto-set |

### `machine_types`
Defines categories of machines (e.g. "Vending Machine", "Kiosk").

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| name | TEXT UNIQUE | Required |
| created_at | DATETIME | |

### `machine_type_fields`
Custom fields per machine type (e.g. "Serial Number", "Location").

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| machine_type_id | INTEGER FK | References `machine_types(id)` ON DELETE CASCADE |
| name | TEXT | Field label |
| created_at | DATETIME | |

### `machines`
The actual machines owned by customers.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| machine_type_id | INTEGER FK | References `machine_types(id)` |
| customer_id | INTEGER FK | References `customers(id)` ON DELETE CASCADE |
| machine_id | TEXT UNIQUE | Human-readable machine identifier |
| subscription_fees | REAL | Configured renewal fee for this machine |
| registered_date | DATETIME | |
| end_date | DATETIME | Subscription expiry date |
| allow_after_expired | BOOLEAN | When `1`, the machine may remain active and be renewed after `end_date`; defaults to `0` |
| status | TEXT | `active` or `inactive` |
| subscription_period | INTEGER | Renewal period in years; must be at least 1 |
| renewal_count | INTEGER | How many times renewed |
| last_renewal_date | DATETIME | |
| data | JSON | Dynamic fields from machine_type_fields |
| renewal_process_id | TEXT | UUID linking machine to active email flow |
| created_at | DATETIME | |

The `20260806_add_allow_renewafterexpire_to_machines.sql` migration introduced the `allow_after_expired` column. The implemented behavior is renewal eligibility after subscription expiration.

### `emails`
Audit log of every email sent by the system.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| sent_date | DATETIME | |
| status | TEXT | `sent`, `failed`, or `pending` |
| recipient_email | TEXT | |
| customer_id | INTEGER FK | |
| nodemailer_message_id | TEXT | SMTP message ID for tracing |
| failed_reason | TEXT | Error message if failed |

### `email_machines`
Links emails to the specific machines they were sent about, and tracks the renewal process lifecycle.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| machine_id | INTEGER FK | |
| first_email_id | INTEGER FK | First reminder email |
| second_email_id | INTEGER FK | Second reminder email (nullable) |
| renewal_process_id | TEXT | UUID — matches `machines.renewal_process_id` |
| order_id | TEXT FK | Set when customer initiates payment |

### `orders`
Payment orders created when a customer initiates renewal.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| order_id | TEXT UNIQUE | Generated order reference |
| transaction_id | TEXT | Fiuu transaction ID |
| payment_status | TEXT | `pending`, `paid`, or `failed` |
| failed_remark | TEXT | Error details if failed |
| paid_on | DATETIME | |
| amount | REAL | Total amount charged |
| channel | TEXT | Payment channel used |
| customer_id | INTEGER FK | |
| process_status | TEXT | `pending`, `processing`, `completed`, or `failed` |
| process_worker_level | INTEGER | Concurrency lock (0=initial, 1=return handler, 2=callback handler) |
| created_at | DATETIME | |

### `order_items`
Links orders to the specific machines being renewed.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| order_id | TEXT FK | |
| machine_id | TEXT FK | |
| created_at | DATETIME | |

---

## 6. Architecture Overview

The system runs as **two separate PM2 processes**:

```
┌─────────────────────────────┐     ┌──────────────────────────────┐
│        Web Process          │     │        Cron Worker           │
│       (src/index.js)        │     │      (src/jobs/worker.js)    │
│                             │     │                              │
│  Express HTTP server        │     │  Every 5 min:                │
│  Admin panel routes         │     │    - handleExpiredMachines   │
│  Payment routes             │     │    - reconcilePayment        │
│  Customer-facing routes     │     │                              │
│                             │     │  Every 12 hours:             │
│                             │     │    - runReminderEmail        │
│                             │     │                              │
│                             │     │  Daily at midnight:          │
│                             │     │    - backupDatabase          │
└──────────────┬──────────────┘     └──────────────┬───────────────┘
               │                                    │
               └──────────────┬─────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   SQLite Database  │
                    │   (database.db)    │
                    └────────────────────┘
```

Both processes share the same SQLite database file. SQLite WAL (Write-Ahead Log) mode is enabled to safely allow concurrent reads and writes from both processes.

---

## 7. Core Flows

### 7.1 Reminder Email Flow

```
node-cron (every 12 hours)
    │
    ▼
runReminderEmail.js
    │
    ▼
reminderEmail.js (service)
    │  Queries machines where end_date is within reminder window
    │  Groups machines by customer/company
    │
    ▼
prepareAndSendDueDateEmail() in nodemailer.js
    │
    ├── For each company:
    │     ├── Generate JWT-signed URL: /machines?token=<jwt>
    │     ├── Insert email record (status: pending)
    │     ├── Send email via Nodemailer (reminderTransporter)
    │     ├── Update email record (status: sent or failed)
    │     └── Upsert email_machines record:
    │           - If first email: insert new record, set renewal_process_id
    │           - If second email: update second_email_id
    │
    └── If any emails failed:
          Send failure summary to CS_EMAIL + DEV_EMAIL
```

**Key design decision:** Each renewal cycle gets a `renewal_process_id` (UUID) generated at first email send. This ID links the machine → email record → order together, making it possible to track a renewal from first reminder through to payment completion.

### 7.1.1 Renewal After Expiration

The `machines.allow_after_expired` flag controls the post-expiration policy. It is exposed to administrators as **Allow Renewal After Subscription Expiration** and defaults to disabled.

- When the flag is disabled and an end date is in the past, the machine is treated as expired and is eventually set to `inactive` by the expiry job. Any existing `renewal_process_id` is cleared so the old reminder cycle cannot be used.
- When the flag is enabled, the machine may remain `active` after its end date. This does not by itself make the machine payable: the customer must also have a `renewal_process_id` created by the reminder email flow.
- The customer machine page can display expired machines, but an expired machine is selectable only when both `allow_after_expired = 1` and `renewal_process_id` is present. Otherwise it is shown as disabled and the customer is directed to support.
- The reminder flow normally targets active machines up to 45 days before expiration, with a second reminder when 7 days or fewer remain. The expired-renewal path therefore depends on the existing reminder record remaining linked to the machine.

The flag is applied when machines are created or edited. If an administrator supplies an end date in the past while the flag is disabled, the controller forces the machine status to `inactive`; with the flag enabled, the submitted status may remain active.

---

### 7.2 Payment Flow

```
Customer clicks link in email
    │
    ▼
GET /machines?token=<jwt>
    │  JWT verified — extracts customer_id
    │  Fetches machines eligible for renewal
    │
    ▼
Customer selects machines → POST /payment
    │
    ├── Validate machineIds and customerId
    ├── Verify machines exist in email_machines (must have gone through email flow)
    ├── The page enables expired selections only when allow_after_expired = 1 and renewal_process_id exists
    ├── Server-side payment validation requires the machine renewal_process_id to match an email_machines record
    ├── Calculate total amount
    ├── Generate order ID
    ├── DB Transaction (immediate):
    │     ├── INSERT into orders
    │     ├── INSERT into order_items (one per machine)
    │     └── UPDATE email_machines.order_id
    └── Build hidden form → redirect to Fiuu gateway
              │
              ▼
        Fiuu Payment Gateway
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
POST /return        POST /callback
(browser redirect)  (server-to-server)
    │                   │
    │   process_worker_level = 1    process_worker_level = 2
    │                   │
    └─────────┬─────────┘
              │
              ▼
        On success:
        ├── Update machine end_date (+ subscription_period years)
        ├── If the machine is more than 3 months expired, extend from today; otherwise extend from its stored end_date
        ├── Clear renewal_process_id on machine
        ├── Clear renewal_process_id on email_machines
        ├── Update order: process_status = completed
        └── Send confirmation email to CS_EMAIL
```

**Key design decision — concurrency lock:** Both `/return` and `/callback` can arrive at nearly the same time. The `process_worker_level` column acts as a versioned lock — each handler only updates if the current level is below its own level. This prevents double-processing.

The same end-date calculation is used by the browser return handler, the server callback, payment reconciliation, and manual renewal records. After a successful renewal, the machine is set back to `active`, its renewal count is incremented, the renewal process IDs are cleared, and the completed order is recorded.

---

### 7.3 Reconciliation Flow

Runs every 5 minutes via `generalJobsRunner`. Handles orders that got stuck in `pending` or `processing` state — e.g. customer paid but didn't return to site, or callback was delayed.

```
reconcilePayment()
    │
    ├── Fetch all orders where process_status IN (pending, processing)
    │   AND created more than 5 minutes ago
    │
    ├── Batch order IDs (max 100 per request) → Fiuu Indirect Status Inquiry API
    │
    ├── For each result from Fiuu:
    │     ├── Q203 error → mark as failed (transaction not found, user abandoned)
    │     ├── status 11 (failed) → mark order as failed
    │     ├── status 22 (pending) → leave pending, reset worker level
    │     └── status 00 (success) → update machines, complete order
    │
    ├── Send success summary email to CS_EMAIL
    └── Send failure alert to CS_EMAIL + DEV_EMAIL
        └── If failed to even update process_status → send critical alert to DEV_EMAIL
```

---

## 8. Background Jobs

All jobs are scheduled in `src/jobs/worker.js` and run in the separate PM2 cron process.

| Job | Schedule | Purpose |
|---|---|---|
| `generalJobsRunner` | Every 5 minutes | Runs `handleExpiredMachines` and `reconcilePayment` |
| `runReminderEmail` | Every 12 hours | Sends due date reminder emails |
| `backupDatabase` | Daily at midnight | Backs up SQLite DB locally and to Backblaze |

### `handleExpiredMachines`
Runs every 5 minutes and checks active machines whose `end_date` is at least one day in the past.

- For machines with `allow_after_expired = 0`, clears `renewal_process_id`, sets `status` to `inactive`, and includes them in the Customer Support notification email.
- For machines with `allow_after_expired = 1`, leaves them active and reports them as still eligible for renewal after expiration. The notification is sent at 00:05 and 12:05 in the `Asia/Kuala_Lumpur` timezone.
- The allowed machines remain active indefinitely unless another flow changes their status; the notification explicitly calls this out for follow-up.

The job does not create a new renewal process for an expired machine. The page uses both the flag and `renewal_process_id` to enable an expired selection, while the payment endpoint independently requires the existing `renewal_process_id` to match an `email_machines` record before creating an order.

### `reconcilePayment`
See [7.3 Reconciliation Flow](#73-reconciliation-flow) above.

### `backupDatabase`
See [13. Backup System](#13-backup-system) below.

---

## 9. API Endpoints

### Public / Customer-facing

| Method | Path | Description |
|---|---|---|
| GET | `/` | Public AR Vending landing page |
| GET | `/machines` | Machine selection page (requires valid JWT token) |
| POST | `/payment` | Initiates payment — requires origin check |
| POST | `/return` | Fiuu browser redirect after payment |
| POST | `/callback` | Fiuu server-to-server payment notification |
| GET | `/cancel` | Payment cancelled page |
| GET | `/status-check` | Public payment status checker |
| GET | `/get-order-info` | Fetch order status by order ID |
| GET | `/send-email` | Manually trigger reminder email (dev/testing) |

### Admin — Rendering

| Method | Path | Description |
|---|---|---|
| GET | `/admin/login` | Login page |
| POST | `/admin/login` | Login form submission |
| GET | `/admin` | Dashboard home |
| GET | `/admin/customers` | Customer list |
| GET | `/admin/customers/add` | Add customer form |
| GET | `/admin/customers/:id` | View customer |
| GET | `/admin/customers/:id/edit` | Edit customer form |
| GET | `/admin/machines` | Machine list |
| GET | `/admin/machines/add` | Add machine form |
| GET | `/admin/machines/:id` | View machine |
| GET | `/admin/machines/:id/edit` | Edit machine form |
| GET | `/admin/machine-types/manage` | Manage machine types and fields |
| GET | `/admin/emails-history` | Email audit log |
| GET | `/admin/orders` | Order history |
| GET | `/admin/back` | Navigate to previous admin page |

### Admin — API (authentication enabled in production; origin check applied where shown)

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/machines/type/:id` | Get machines by type |
| GET | `/api/admin/machines/type/:id/fields` | Get type fields |
| GET | `/api/admin/get-machine-types` | Get all machine types |
| POST | `/api/admin/customers/add` | Create customer — origin check |
| POST | `/api/admin/machines/add` | Create machine — origin check |
| POST | `/api/admin/machines/type/add` | Create machine type — origin check |
| POST | `/api/admin/machines/type/:id/fields/add` | Add field to type — origin check |
| PATCH | `/api/admin/customers/:id/edit` | Update customer |
| PATCH | `/api/admin/machines/:id/edit` | Update machine |
| PATCH | `/api/admin/machines/type/:typeId/fields` | Update type fields |
| DELETE | `/api/admin/customers/:id` | Delete customer |
| DELETE | `/api/admin/machines/:id` | Delete machine |
| DELETE | `/api/admin/machines/type/:id` | Delete machine type |
| DELETE | `/api/admin/machines/type/:typeId/fields/:fieldId` | Delete type field |

---

## 10. Admin Panel

The admin panel is protected by a single shared password stored as a bcrypt hash in `.env`.

### Session Management
- Sessions use `express-session` with `sameSite: strict` and `secure: true` in production
- Session regeneration occurs after login to prevent session fixation attacks
- A session-based navigation history stack (max 10 entries) powers the `/admin/back` route

### Machine Types & Dynamic Fields
One of the standout features. Instead of hardcoded machine categories:

- Admins create machine types (e.g. "ATM", "Vending Machine", "Kiosk")
- Each type can have custom fields added (e.g. "Serial Number", "Location", "Model")
- When adding a machine of that type, the form dynamically renders those fields
- Field values are stored as JSON in `machines.data`

This means adding a new category of machine requires no code changes.

---

## 11. Middlewares

### `isAuthenticated` (`src/middlewares/auth.js`)
Guards all `/admin/*` routes and `/api/*` routes. It checks `req.session.isAdmin`; if not set, browser requests are redirected to `/admin/login` and the requested URL is saved to `req.session.redirectURL`. In development, these route guards are not mounted.

### `verifyOrigin` (`src/middlewares/originCheck.js`)
Applied to the payment initiation route and the customer, machine, and machine-type create/update/delete endpoints that explicitly include the middleware. Checks that the `Origin` or `Referer` header matches `PUBLIC_BASE_URL` from `.env`. Rejects requests with no origin headers entirely. This reduces CSRF risk without a full CSRF token implementation.

---

## 12. Services

### `nodemailer.js`
Two separate Nodemailer transports:
- **`reminderTransporter`** — rate-limited to 1 email/second, max 1 concurrent connection. Used for bulk reminder emails to avoid overwhelming the SMTP server.
- **`otherTransporter`** — higher throughput, used for system alerts, confirmations, and failure notifications.

Both send plain text fallback alongside HTML using `html-to-text`.

### `fiuu.js`
Builds the payment request body for the Fiuu gateway. Handles the specific parameter format Fiuu expects.

### `winston.js`
Configures two transports:
- Console output (development only)
- `winston-daily-rotate-file` — separate files for combined and error logs, rotating daily, kept for 30 days

### `reminderEmail.js`
Queries the database for machines approaching expiry. Groups results by company name for the email batching logic in `nodemailer.js`.

---

## 13. Backup System

Database backups run daily at midnight via the cron worker.

### Strategy
- **Local backup** — kept for 7 days. Fast restore from recent issues.
- **Cloud backup (Backblaze B2)** — kept for 30 days. Disaster recovery if server is lost.

This follows the **3-2-1 backup rule**: 3 copies, 2 storage types, 1 offsite.

### How it works (`src/jobs/backupDB.js`)

```
backupDatabase()
    │
    ├── Create BACKUP_DIR if it doesn't exist
    ├── Validate bucket name is configured
    ├── sqlite3 ".backup" command → safe live backup to local file
    ├── Upload local file to Backblaze B2 via S3-compatible API
    ├── enforceCloudRetention() → delete B2 files older than 30 days
    ├── enforceLocalRetention() → delete local files older than 7 days
    └── On any failure → send critical alert email to DEV_EMAIL
```

### Paths
```
/home/asr-dev/
├── app/                     ← Express application
│   └── src/db/database.db   ← Live database
└── backups/                 ← Local backup files
    ├── database-2026-05-18.db
    └── database-2026-05-19.db
```

### Testing a restore
To verify a backup is valid:

```bash
# Copy a backup file to a temp location
cp /home/asr-dev/backups/database-2026-05-25.db /tmp/test-restore.db

# Open it and verify data
sqlite3 /tmp/test-restore.db "SELECT COUNT(*) FROM customers;"
sqlite3 /tmp/test-restore.db "SELECT COUNT(*) FROM machines;"
```

---

## 14. Deployment

### Prerequisites on the server
- Node.js >= 16
- npm >= 8
- PM2 installed globally: `npm install -g pm2`
- `sqlite3` CLI installed: `sudo apt install sqlite3`

### First-time setup

```bash
# Clone the repository
git clone https://github.com/heinminhtun1999/Automated-Subscription-Renewal.git /home/asr-dev/app
cd /home/asr-dev/app

# Install dependencies
npm ci --omit=dev

# Create and configure .env
cp .env.example .env
nano .env  # Fill in all required values

# Create backup directory
mkdir -p /home/asr-dev/backups

# Initialize machine types if needed
node scripts/initialize-machine-types.js

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Follow the printed command to enable auto-start on reboot
```

### PM2 Processes

| PM2 Name | Script | Purpose |
|---|---|---|
| `asr` (prod) / `asrd` (dev) | `src/index.js` | Web server |
| `asrc` (prod) / `asrdc` (dev) | `src/jobs/worker.js` | Background jobs |

### Useful PM2 commands

```bash
pm2 list                    # See all running processes
pm2 logs asr                # Tail web server logs
pm2 logs asr-crons          # Tail cron worker logs
pm2 restart asr             # Restart web server
pm2 reload asr              # Zero-downtime reload
```

---

## 15. CI/CD Pipeline

Defined in `.github/workflows/deploy.yml`. Triggers on push to `development` or `production` branches.

### Steps
1. **Lint** — runs `npm run lint` (ESLint). Continues on error — does not block deploy.
2. **Install** — `npm ci --omit=dev` (production dependencies only)
3. **Determine target** — sets deployment path and PM2 process name based on branch
4. **Deploy to VPS** — SSH into server, rsync files, restart PM2

| Branch | Deploy Path | PM2 Process |
|---|---|---|
| `development` | `/home/subscription-renewal-dev` | `asr-dev` |
| `production` | `/home/subscription-renewal-prod` | `asr` |

### Required GitHub Secrets
- `DEPLOY_KEY` — SSH private key for the server
- `DEPLOY_HOST` — Server IP or hostname
- `DEPLOY_USER` — SSH username

---

## 16. Known Limitations & Future Work

### Features
- [ ] Customer self-service portal — customers log in and manage their own machines
- [ ] Retry logic for failed reminder emails
- [ ] Bulk machine import via CSV
- [ ] Admin dashboard analytics (expiring this month, revenue, email delivery rate)
- [ ] Machine status history — when did it change and why
- [ ] Soft delete for customers and machines instead of hard delete
- [ ] Machine type field types (number, date, text) for better validation
- [ ] Resend email button in email history view

### Operations
- [ ] No tests — payment flow and reconciliation logic especially need unit tests
- [ ] `getAllOrderItems()` in reconciliation fetches all records — should be scoped to reconciled orders only
- [ ] Database path should use `__dirname`-based absolute path rather than relative `cwd`
- [ ] Duplicate email addresses in customers — protection commented out in schema

### Disabled / Parked Features
- `src/controllers/otp.js.disabled` — OTP-based customer authentication, partially built
- `src/middlewares/verifySession.js.disabled` — Session verification for customer flow
- `src/db/db.js` (commented out) — OTP table schema

These exist as a starting point for the customer self-service portal when that work begins.

---

*This documentation was updated based on the codebase as of September 2026. Update it as the project evolves.*