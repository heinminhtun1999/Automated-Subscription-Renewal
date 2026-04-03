const { generateMd5 } = require("../utils");

// Prepare payment gateway payload and calculate vcode signature.
function preparePaymentBody(data, baseUrl) {

    const date = new Date().getTime();
    const randomNumber = Math.floor(Math.random() * 10000);

    const orderid = `${date}${randomNumber}`;

    const returnURL = `${baseUrl}/return`;
    const callbackURL = `${baseUrl}/callback`;
    const cancelURL = `${baseUrl}/cancel`;

    const body = {
        // amount: data["total"],
        amount: '1.00',
        merchantID: process.env.merchantID,
        orderid: orderid,
        bill_name: data['beneficiaryName'],
        bill_email: data['email'],
        bill_mobile: data['contactNumber'],
        bill_desc: `Machine(s)/Terminal(s) Renewal Payment for ${data['companyName']}`,
        currency: 'MYR',
        returnurl: returnURL,
        callbackurl: callbackURL,
        cancelurl: cancelURL
    };

    const string = `${body.amount}${process.env.merchantID}${body.orderid}${process.env.verifyKey}`;
    const vcode = generateMd5(string);

    body.vcode = vcode;

    return body;
}

module.exports = { preparePaymentBody };