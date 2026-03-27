const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('./services/winston');
const { uid } = require("./dataProcessors");

function generatePaymentLink(data, baseUrl) {
    let url = `https://pay.fiuu.com/RMS/pay/${process.env.merchantID}`;

    const date = new Date().getTime();
    const randomNumber = Math.floor(Math.random() * 1000);
    const uniqueIdentifier = `${date}${randomNumber}`;

    // Determine terminalId based on sheet name
    const terminalId = uid(data);

    const orderid = `${terminalId}-${uniqueIdentifier}-${data['Sheet Name']}`;

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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// VCode for Payment Link
function generateVCode(string) {
    return crypto.createHash('md5').update(string).digest('hex');
}

function generateOTP() {
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
}

function generateJWT(payload) {
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    return token;
}

function verifyJWT(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return { valid: true, decoded };
    } catch (err) {
        logger.error('JWT verification failed:', err);
        return { valid: false, error: err };
    }
}

module.exports = {
    generatePaymentLink,
    sleep,
    generateVCode,
    generateOTP,
    generateJWT,
    verifyJWT
};
