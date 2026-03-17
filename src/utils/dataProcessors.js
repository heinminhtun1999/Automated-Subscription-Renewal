const { ALPHABET, FIRST_EMAIL_DUE_DAYS, SECOND_EMAIL_DUE_DAYS, SHEET_CONFIGS } = require('./constants');

// Format the raw sheet data into an array of objects with key as column header and value as cell value and cell reference
function formatSheetData(rows, sheet) {
    if (!rows || rows.length === 0) {
        return [];
    }
    const formattedData = [];

    const headers = rows[0];

    for (let i = 1; i < rows.length; i++) {

        const data = {};

        for (let j = 0; j < headers.length; j++) {
            const cellValue = generateCellValue(j) + (i + 1).toString();
            data[headers[j]] = {
                value: rows[i][j],
                cell: cellValue
            };
        }

        data['Sheet Name'] = sheet;

        if (data['Email Address'].value === '' || !data['Email Address'].value || !isValidEmail(data['Email Address'].value) || data['Company Name'].value === '' || !data['Company Name'].value) {
            continue;
        }

        formattedData.push(data);
    }

    return formattedData;
}

function filterByDate(data, endDateColumn, renewalEndDateColumn, daysBefore) {
    return data.filter(row => {

        if (!row[endDateColumn] || !row[renewalEndDateColumn]) return false;

        const DAY_MS = 24 * 60 * 60 * 1000;

        // Need to check for two different columns as there are two different columns for the renewal date
        // Get the end date and renewal end date in milliseconds
        const endDate = new Date(row[endDateColumn].value).getTime()
            + DAY_MS - 1;

        const renewalEndDate = new Date(row[renewalEndDateColumn].value).getTime()
            + DAY_MS - 1;

        // Calculate remaining days
        const now = new Date().getTime();
        // Move expiry to 23:59:59.999 so the user gets full expiry day by adding 1 day
        const remainingEndDate = (endDate - now) / DAY_MS;
        const remainingRenewalEndDate = (renewalEndDate - now) / DAY_MS;

        const isEndValid =
            !isNaN(endDate) &&
            remainingEndDate >= 0 &&
            remainingEndDate <= daysBefore;

        if (isEndValid) return true;

        // Check if the remaining day is within 30 days and is not notified. 
        // If already notified, notify again only on every 7th day. 
        const isRenewalValid =
            !isNaN(renewalEndDate) &&
            remainingRenewalEndDate >= 0 &&
            remainingRenewalEndDate <= daysBefore;

        if (isRenewalValid) return true;

        return false;

    });
}

// Separate the list by given notified column into notified and not notifed
function separateNotified(data, notifiedColumn) {
    const notNotified = [];
    const alreadyNotified = [];

    for (const row of data) {
        if (row[notifiedColumn].value === 'No' || row[notifiedColumn].value === '') { // Add to not notified, if the value is not defined, or "No"
            notNotified.push(row);
        } else {
            alreadyNotified.push(row);
        }
    }
    return { notNotified, alreadyNotified };
}

function groupByCID(data) {
    const groupedData = {};

    for (const row of data) {
        const cid = row['CID'].value;

        if (!groupedData[cid]) {
            groupedData[cid] = [];
            groupedData[cid].push(row);
        } else {
            groupedData[cid].push(row);
        }
    }
    return groupedData;
}

// Convert column index to cell value (e.g., 0 -> A, 1 -> B, ..., 25 -> Z, 26 -> AA, 27 -> AB, ...)
// How it compute: For index 0-25, it directly maps to A-Z. For index 26, it calculates the quotient and remainder when divided by 26. 
// The quotient determines how many times we have gone through the alphabet, and the remainder determines the current letter. 
// It recursively calls itself with the quotient minus one to build the cell value for indices greater than 25.
function generateCellValue(colIndex) {

    if (colIndex < 0) {
        return '';
    }

    const q = Math.floor(colIndex / 26); // Quotient
    const r = colIndex % 26; // Remainder
    const value = ALPHABET[r];

    return generateCellValue(q - 1) + value;
}

function isValidEmail(email) {
    const emailRegex = /^[A-Za-z0-9._-]+@[A-Za-z]+\.[A-Za-z]{2,3}(?:\.[A-Za-z]{2,3})?$/;
    return emailRegex.test(email);
}


// Build the renewal reminder buckets for a sheet based on 45-day and 7-day windows.
function runDatePipeline(rows, endDateColumn, renewalEndDateColumn) {
    const within45Days = filterByDate(rows, endDateColumn, renewalEndDateColumn, FIRST_EMAIL_DUE_DAYS);
    const { notNotified: firstEmailNotNotified, alreadyNotified: firstEmailNotified } =
        separateNotified(within45Days, 'First Email Sent');

    const within7Days = filterByDate(firstEmailNotified, endDateColumn, renewalEndDateColumn, SECOND_EMAIL_DUE_DAYS);
    const { notNotified: secondEmailNotNotified } = separateNotified(within7Days, 'Second Email Sent');

    return { firstEmailNotNotified, secondEmailNotNotified };
}

function getCombinedPipelineByDueDate(data) {
    const sheetPipelines = SHEET_CONFIGS.map((config, index) => {
        // Create a per-sheet pipeline so each sheet uses its own date columns.
        const formatted = formatSheetData(data[index].values, config.sheetKey);
        return runDatePipeline(formatted, config.endDateColumn, config.renewalEndDateColumn);
    });
    return sheetPipelines.flatMap((pipeline) => [
        ...pipeline.firstEmailNotNotified,
        ...pipeline.secondEmailNotNotified
    ]);
}


module.exports = {
    runDatePipeline,
    getCombinedPipelineByDueDate,
    groupByCID,
    separateNotified
};