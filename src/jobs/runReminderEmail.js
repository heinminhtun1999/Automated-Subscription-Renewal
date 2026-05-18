// Module Imports
const path = require('path');
const dotenv = require('dotenv');
const runReminderEmailJob = require("../utils/services/reminderEmail");
const logger = require('../utils/services/winston');

const reminderEmailRunnder = async () => {
    try {
        // Ensure environment variables are loaded from .env file
        dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
        
        const result = await runReminderEmailJob();
        logger.info('Reminder Emails job successfullly processed via cron job.')
        return result;
    } catch (error) {
        logger.error('Error in runReminderEmail cronjob:', error);
        return;
    }
};

module.exports = reminderEmailRunnder;