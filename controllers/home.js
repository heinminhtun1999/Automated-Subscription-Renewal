// Module Imports
const {
    formatSheetData,
    findDueDates,
    uid,
    generatePaymentLink,
    sleep,
    updateCellValue,
    getDueDate
} = require('../utils/utils');
const { dueDateTemplate, failListTemplate } = require('../utils/htmlTemplates');
const { sendEmail } = require('../utils/nodemailer');

const homeController = async (req, res, auth, google) => {

    const sheets = google.sheets({
        version: 'v4',
        auth: await auth.getClient(),
    });

    const spreadsheet = '1WFwUa4dBm53XNbqkLRxmRyyIkRlDmLSfJJ5fsMe6SfE';
    const range = ['UID Customer List!A1:Z', 'MI20 UID Customer List!A1:Z', 'TID ARV2.5 Customer List!A1:Z', 'U20 Customer List!A1:Z'];

    const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: spreadsheet,
        ranges: range,
    });

    const data = response.data.valueRanges;

    // Find due dates from all sheets
    const uidList = findDueDates(formatSheetData(data[0].values, 'beep'), 'End Date', 'Renewal End Date');
    const mi20List = findDueDates(formatSheetData(data[1].values, 'mi20'), 'Paysys End Date', 'Arv Renewal End Date');
    const arv2_5List = findDueDates(formatSheetData(data[2].values, 'arv2.5'), 'End Date', 'Renewal End Date');
    const u20List = findDueDates(formatSheetData(data[3].values, 'u20'), 'End Date', 'Renewal End Date');

    const combinedData = [...uidList, ...mi20List, ...arv2_5List, ...u20List];
    return res.send(combinedData);
    // Send Emails to all due dates found
    const failList = [];
    let i = 0;
    for (const recipient of combinedData) {

        if (i === 5) {
            break;
        }

        // Prepare email content
        const baseURL = `${req.protocol}://${req.get('host')}`;
        const paymentLink = generatePaymentLink(recipient, baseURL);
        const uidValue = uid(recipient);
        const dueDate = getDueDate(recipient);
        const body = dueDateTemplate(paymentLink, uidValue, dueDate);

        // Send email
        const mailResult = await sendEmail(recipient['Email Address'].value, `|AR VENDING| Subscription Expiry Reminder – TID: ${uidValue}`, body);

        // Handle result
        if (mailResult.ok) {

            // Update Google Sheet to mark as notified
            const updateResult = await updateCellValue(sheets, spreadsheet, 'Notified', recipient, 'Yes');

            console.log('%d cells updated.', updateResult.data.updatedCells);

        } else {
            failList.push(recipient);
            if (mailResult.error && (mailResult.error.code === 'EAUTH' || mailResult.error.responseCode === 535)) {
                console.error('Auth error detected; stopping further sends.');
                break;
            }
        }

        i++;
        console.log(`Processed ${i} of ${combinedData.length} emails.`);
        await sleep(60000); // Sleep for 60 seconds between emails to avoid rate limiting
    }

    if (failList.length > 0) {
        const failBody = failListTemplate(failList);
        const result = await sendEmail('customerservice@arvending.com.my', '|AR VENDING| Failed Email List', failBody);

        if (!result.ok) {
            console.error('Failed to send email list to customer service.');
        } else {
            console.log('Failed email list sent to customer service.');
        }
    }

    return res.send(combinedData);
};

module.exports = { homeController };