// Module Imports
const dotenv = require('dotenv');
const runReminderEmailJob = require("../utils/services/reminderEmail");
const logger = require('../utils/services/winston');

const reminderEmailController = async (req, res) => {
    try {
        const result = await runReminderEmailJob();
        logger.info('Reminder Emails job successfullly processed via controller.')
        return res.send(result);
    } catch (error) {
        logger.error('Error in reminderEmailController:', error);
        return res.status(500).send('An error occurred while processing the request.');
    }
};

module.exports = reminderEmailController;