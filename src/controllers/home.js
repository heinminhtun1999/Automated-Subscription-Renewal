// Module Imports
const { getCombinedPipelineByDueDate, groupByCID } = require('../utils/dataProcessors');
const { prepareAndSendDueDateEmail } = require('../utils/services/nodemailer');
const { getSheetData } = require('../utils/services/sheets');
const logger = require('../utils/services/winston');




const homeController = async (req, res) => {

    try {
        const response = await getSheetData();
        const data = response.data.valueRanges;

        
        // Combine all the list of terminals which satisfy the criteria for sending email into one list, and group by company name to prepare for email sending.
        const combinedData = getCombinedPipelineByDueDate(data);

        const groupedData = groupByCID(combinedData);
        
        // Send email to the customers with the list of terminals that are due for renewal, 
        // and update the notified column in the sheet accordingly. 
        // If there is any failure in sending email, log the error and send a summary email to customer service.
        await prepareAndSendDueDateEmail(groupedData, `${req.protocol}://${req.get('host')}`);

        return res.send(groupedData);
    } catch (error) {
        logger.error('Error in homeController:', error);
        return res.status(500).send('An error occurred while processing the request.');
    }


};

module.exports = homeController;