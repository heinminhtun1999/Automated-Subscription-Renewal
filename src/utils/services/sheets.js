const { google } = require('googleapis');
const logger = require('./winston');

// Import Constants
const { CREDENTIALS_PATH, SCOPES, RANGE, SHEET_NAMES } = require('../constants');

// Google Auth Setup
const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: SCOPES,
});

// Build an authenticated Sheets client.
async function getSheetsClient() {
    return google.sheets({
        version: 'v4',
        auth: await auth.getClient(),
    });
}

// Fetch batch ranges for all configured sheets.
async function getSheetData() {
    const sheets = await getSheetsClient();
    return await sheets.spreadsheets.values.batchGet({
        spreadsheetId: process.env.SHEET_ID,
        ranges: RANGE,
    });
}

// Update a single sheet cell for a recipient row.
async function updateCellValue(field, recipient, value) {
    const sheets = await getSheetsClient();
    const sheetName = SHEET_NAMES[recipient['Sheet Name']];
    const range = `${sheetName}!${recipient[field].cell}`; // Format Example: UID Customer List!D5
    const resource = { values: [[value]] };

    try {
        const result = await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SHEET_ID,
            range: range,
            valueInputOption: 'RAW',
            resource: resource,
        });
        return { ok: true, result };
    } catch (error) {
        logger.error('Error updating cell value:', error);
        return { ok: false, error };
    }

}

module.exports = { getSheetData, updateCellValue };