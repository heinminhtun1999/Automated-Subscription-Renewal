// Module Imports
const {
    formatSheetData,
    filterByDate,
    separateNotified,
    groupByCompanyName,
} = require('../utils/utils');
const { prepareAndSendDueDateEmail } = require('../utils/services/nodemailer');
const { getSheetData } = require('../utils/services/sheets');
const logger = require('../utils/services/winston');

const homeController = async (req, res) => {

    try {
        const response = await getSheetData();
        const data = response.data.valueRanges;

        // First find the terminals that are due for renewal within 45 days
        const within45DaysUIDList = filterByDate(formatSheetData(data[0].values, 'beep'), 'End Date', 'Renewal End Date', 45);
        const within45DaysMI20List = filterByDate(formatSheetData(data[1].values, 'mi20'), 'Paysys End Date', 'Arv Renewal End Date', 45);
        const within45DaysArv2_5List = filterByDate(formatSheetData(data[2].values, 'arv2.5'), 'End Date', 'Renewal End Date', 45);
        const within45DaysU20List = filterByDate(formatSheetData(data[3].values, 'u20'), 'End Date', 'Renewal End Date', 45);

        // Separte the list which are within the 45 days of expiration into Notified, and Not Notified
        // If Not Notified, direrctly add to the email list. If already notified, check if the due date is within 7 days.
        const { notNotified: firstEmailNotNotifiedUidList, alreadyNotified: firstEmailNotifiedUidList } = separateNotified(within45DaysUIDList, "First Email Sent");
        const { notNotified: firstEmailNotNotifiedMi20List, alreadyNotified: firstEmailNotifiedMi20List } = separateNotified(within45DaysMI20List, "First Email Sent");
        const { notNotified: firstEmailNotNotifiedArv2_5List, alreadyNotified: firstEmailNotifiedArv2_5List } = separateNotified(within45DaysArv2_5List, "First Email Sent");
        const { notNotified: firstEmailNotNotifiedU20List, alreadyNotified: firstEmailNotifiedU20List } = separateNotified(within45DaysU20List, "First Email Sent");

        // Get the list of terminals that are already notified, check if the due date is within 7 days. If within 7 days, and not yet sent second email, add to email list.
        const within7DaysUIDList = filterByDate(firstEmailNotifiedUidList, 'End Date', 'Renewal End Date', 7);
        const within7DaysMI20List = filterByDate(firstEmailNotifiedMi20List, 'Paysys End Date', 'Arv Renewal End Date', 7);
        const within7DaysArv2_5List = filterByDate(firstEmailNotifiedArv2_5List, 'End Date', 'Renewal End Date', 7);
        const within7DaysU20List = filterByDate(firstEmailNotifiedU20List, 'End Date', 'Renewal End Date', 7);

        // Get the list of terminals which are within 7 days of expiration and not yet sent second email
        const { notNotified: secondEmailNotNotifiedUidList } = separateNotified(within7DaysUIDList, "Second Email Sent");
        const { notNotified: secondEmailNotNotifiedMi20List } = separateNotified(within7DaysMI20List, "Second Email Sent");
        const { notNotified: secondEmailNotNotifiedArv2_5List } = separateNotified(within7DaysArv2_5List, "Second Email Sent");
        const { notNotified: secondEmailNotNotifiedU20List } = separateNotified(within7DaysU20List, "Second Email Sent");

        // Combine all the list of terminals which satisfy the criteria for sending email into one list, and group by company name to prepare for email sending.
        const combinedData = [
            ...firstEmailNotNotifiedUidList,
            ...firstEmailNotNotifiedMi20List,
            ...firstEmailNotNotifiedArv2_5List,
            ...firstEmailNotNotifiedU20List,
            ...secondEmailNotNotifiedUidList,
            ...secondEmailNotNotifiedMi20List,
            ...secondEmailNotNotifiedArv2_5List,
            ...secondEmailNotNotifiedU20List
        ];
        const groupedData = groupByCompanyName(combinedData);

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