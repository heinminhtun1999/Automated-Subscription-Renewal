const crypto = require('crypto');

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

function uid(recipient) {
    if (recipient['Sheet Name'] === 'beep') {
        return recipient['UID'].value;
    } else if (recipient['Sheet Name'] === 'mi20') {
        return recipient['TERMINAL-ID'].value;
    } else if (recipient['Sheet Name'] === 'arvdn') {
        return recipient['Machine ID'].value;
    } else {
        return recipient['TID'].value;
    }
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


module.exports = {
    generatePaymentLink,
    uid,
    sleep,
    generateVCode,
    generateOTP
};
