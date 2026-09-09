require('dotenv').config();
const cron = require("node-cron");
const generalJobsRunner = require("./generalJobsRunner");
const reminderEmailRunner = require("./runReminderEmail");
const dbBackup = require("./backupDB");

// Machine expiration checking and payment reconciliation cron
cron.schedule("*/5 * * * *", generalJobsRunner, {
    timezone: 'Asia/Kuala_Lumpur'
}); // Every 5 mins

// Reminder Email Cron
cron.schedule("0 */12 * * *", reminderEmailRunner, {
    timezone: 'Asia/Kuala_Lumpur'
}); // Every 12 hours

// Database Backup Cron
if (process.env.NODE_ENV === 'production') {
    cron.schedule("0 0 * * *", dbBackup, {
        timezone: 'Asia/Kuala_Lumpur'
    }); // Every day at 00:00:00 AM
}
