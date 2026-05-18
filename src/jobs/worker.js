const cron = require("node-cron");
const generalJobsRunner = require("./generalJobsRunner");
const reminderEmailRunner = require("./runReminderEmail");

cron.schedule("*/5 * * * *", generalJobsRunner);
cron.schedule("*/5 * * * *", reminderEmailRunner);