const nodemailer = require("nodemailer");
const { convert } = require('html-to-text');

// Nodemailer Setup
const transporter = nodemailer.createTransport({
    host: "smtp.bizmail.yahoo.com",
    port: 465,
    secure: true, // Use true for port 465, false for port 587
    auth: {
        user: "acct.notify@arvending.com.my",
        pass: "yxayhhaywupimyqf",
    },
    pool: true,
    maxConnections: 1,
    maxMessages: 100,
    tls: {
        // Accept self-signed or invalid certificates
        rejectUnauthorized: false,
    },
});

async function sendEmail(to, subject, body) {
    try {

        const textBody = convert(body, { wordwrap: 130 });

        const info = await transporter.sendMail({
            from: '"AR Vending" <acct.notify@arvending.com.my>',
            to: to,
            subject: subject,
            text: textBody,
            html: body,
            priority: 'high',
            headers: {
                'X-Priority': '1',
                'Importance': 'high'
            }
        });

        console.log("Message sent to", to, ":", info.messageId);

        return { ok: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending to", to, ":", error);
        return { ok: false, error: error };
    }
}

module.exports = { sendEmail };