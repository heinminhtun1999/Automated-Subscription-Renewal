// Module Imports
const runReminderEmailJob = require("../utils/services/reminderEmail");
const logger = require('../utils/services/winston');

const reminderEmailRunnder = async () => {
    try {
        const result = await runReminderEmailJob();
        logger.info('Reminder Emails job successfullly processed via cron job.')
        return result;
    } catch (error) {
        logger.error('Error in runReminderEmail cronjob:', error);
        return;
    }
};

module.exports = reminderEmailRunnder;