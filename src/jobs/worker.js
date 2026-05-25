require('dotenv').config();
const cron = require("node-cron");
const generalJobsRunner = require("./generalJobsRunner");
const reminderEmailRunner = require("./runReminderEmail");
const dbBackup = require("./backupDB");

cron.schedule("*/5 * * * *", generalJobsRunner);
cron.schedule("0 */12 * * *", reminderEmailRunner);
cron.schedule("0 0 * * *", dbBackup);