require('dotenv').config();
const cron = require("node-cron");
const generalJobsRunner = require("./generalJobsRunner");
const reminderEmailRunner = require("./runReminderEmail");
const dbBackup = require("./backupDB");

cron.schedule("*/5 * * * *", generalJobsRunner); // Evert 5 mins
cron.schedule("0 */12 * * *", reminderEmailRunner); // Every 12 hours
cron.schedule("0 0 * * *", dbBackup); // Everyday at 00:00:00 AM