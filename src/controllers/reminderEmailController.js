// Module Imports
const path = require('path');
const dotenv = require('dotenv');
const runReminderEmailJob = require("../utils/services/reminderEmail");
const logger = require('../utils/services/winston');

// Ensure environment variables are loaded from .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const reminderEmailController = async (req, res) => {
    try {
        const result = await runReminderEmailJob();

        if (!result.success) {
            throw new Error(result.error)
        }
        logger.info('Reminder Emails job successfullly processed via controller.')
        return res.send(result);
    } catch (error) {
        logger.error('Error in reminderEmailController:', error);
        return res.status(500).json({success: false, message: error.message || 'An error occurred while processing the request.'});
    }
};

module.exports = reminderEmailController;