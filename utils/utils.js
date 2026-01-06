const crypto = require('crypto');
const { sheetNames, alphabet } = require('./constants');

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
        formattedData.push(data);
    }

    return formattedData;
}

function findDueDates(data, endDateColumn, renewalEndDateColumn) {
    return data.filter(row => {

        if (row['Email Address'].value === '' || !row['Email Address'].value) {
            return false;
        }

        const now = new Date().getTime();

        const DAY_MS = 24 * 60 * 60 * 1000;

        // Need to check for two different columns as there are two different columns for the renewal date
        // Get the end date and renewal end date in milliseconds
        const endDate = new Date(row[endDateColumn].value).getTime()
            + DAY_MS - 1;

        const renewalEndDate = new Date(row[renewalEndDateColumn].value).getTime()
            + DAY_MS - 1;

        // Calculate remaining days
        const remainingEndDate = (endDate - now) / DAY_MS;
        const remainingRenewalEndDate = (renewalEndDate - now) / DAY_MS;

        const isEndValid =
            !isNaN(endDate) &&
            remainingEndDate >= 0 &&
            remainingEndDate <= 365;

        // Check if the remaining day is within 30 days and is not notified. 
        // If already notified, notify again only on every 7th day.
        if (isEndValid) {
            if (row['Notified'].value === 'No' || !row['Notified'].value) {
                return true;
            } else {
                if (Math.floor(remainingEndDate) % 7 === 0) {
                    return true;
                }
            }
        }

        // Check if the remaining day is within 30 days and is not notified. 
        // If already notified, notify again only on every 7th day. 
        const isRenewalValid =
            !isNaN(renewalEndDate) &&
            remainingRenewalEndDate >= 0 &&
            remainingRenewalEndDate <= 365;

        if (isRenewalValid) {
            if (row['Notified'].value === 'No' || !row['Notified'].value) {
                return true;
            } else {
                if (Math.floor(remainingRenewalEndDate) % 7 === 0) {
                    return true;
                }
            }
        }

        return false;
    });
}

function generatePaymentLink(data, baseUrl) {
    let url = `https://pay.fiuu.com/RMS/pay/${process.env.merchantID}`;

    const date = new Date().getTime();

    // Determine terminalId based on sheet name
    const terminalId = uid(data);

    const orderid = `${terminalId}-${date}-${data['Sheet Name']}`;

    const returnURL = `${baseUrl}/return`;
    const callbackURL = `${baseUrl}/callback`;
    const cancelURL = `${baseUrl}/cancel`;

    const body = {
        // amount: parseFloat(data["Renewal Fee (RM)"]).toFixed(2),
        amount: '1.00',
        orderid: orderid,
        bill_name: data['Beneficiary Name'].value,
        bill_email: data['Email Address'].value,
        bill_mobile: data['Contact Number'].value,
        bill_desc: `Renewal Payment for TID - ${terminalId}`,
        currency: 'MYR',
        returnurl: returnURL,
        callbackurl: callbackURL,
        cancelurl: cancelURL,
        waittime: '300', // 1 Day
        metadata: JSON.stringify({ sheet: data['Sheet Name'], terminalId: terminalId }),
    };

    const string = `${body.amount}${process.env.merchantID}${body.orderid}${process.env.verifyKey}`;
    const vcode = generateVCode(string);

    body.vcode = vcode;

    url = url + '?' + new URLSearchParams(body).toString();

    return url;
}

async function updateCellValue(sheets, spreadsheet, field, recipient, value) {
    const sheetName = sheetNames[recipient['Sheet Name']];
    const range = `${sheetName}!${recipient[field].cell}`;
    const resource = { values: [[value]] };

    const result = await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheet,
        range: range,
        valueInputOption: 'RAW',
        resource: resource,
    });

    return result;
}

function uid(recipient) {
    if (recipient['Sheet Name'] === 'beep') {
        return recipient['UID'].value;
    } else if (recipient['Sheet Name'] === 'mi20') {
        return recipient['TERMINAL-ID'].value;
    } else {
        return recipient['TID'].value;
    }
}

function getDueDate(recipient) {
    if (recipient['Sheet Name'] === 'mi20') {
        return recipient['Arv Renewal End Date'].value ? recipient['Arv Renewal End Date'].value : recipient['Paysys End Date'].value;
    } else {
        return recipient['Renewal End Date'].value ? recipient['Renewal End Date'].value : recipient['End Date'].value;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// The reminder: This ain't bullshit magic. It's just converting a number to base 26 with A-Z characters. Took me whole freaking day to figure it out.
// E.g., 0 -> A, 1 -> B, ..., 25 -> Z, 26 -> AA, 27 -> AB, ...
function generateCellValue(colIndex) {

    if (colIndex < 0) {
        return '';
    }

    const q = Math.floor(colIndex / 26); // Quotient
    const r = colIndex % 26;              // Remainder
    const value = alphabet[r]; //

    return generateCellValue(q - 1) + value;
}

// VCode for Payment Link
function generateVCode(string) {
    return crypto.createHash('md5').update(string).digest('hex');
}


module.exports = {
    formatSheetData,
    findDueDates,
    generatePaymentLink,
    uid,
    sleep,
    generateVCode,
    updateCellValue,
    getDueDate
};
