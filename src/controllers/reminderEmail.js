// Module Imports
const { getGroupedData } = require('../utils/dataProcessors');
const { prepareAndSendDueDateEmail } = require('../utils/services/nodemailer');
const { getSheetData } = require('../utils/services/sheets');
const logger = require('../utils/services/winston');

// Trigger reminder emails for upcoming renewals and return grouped data.
const reminderEmailController = async (req, res) => {

    try {
        const groupedData = await getGroupedData(false, ["firstEmailNotNotified", "secondEmailNotNotified"]);
        
        // Send email to the customers with the list of terminals that are due for renewal, 
        // and update the notified column in the sheet accordingly. 
        // If there is any failure in sending email, log the error and send a summary email to customer service.
        await prepareAndSendDueDateEmail(groupedData, `${req.protocol}://${req.get('host')}`);

        return res.send(groupedData);
    } catch (error) {
        logger.error('Error in reminderEmailController:', error);
        return res.status(500).send('An error occurred while processing the request.');
    }


};

module.exports = reminderEmailController;