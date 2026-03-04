const nodemailer = require('nodemailer');
const { convert } = require('html-to-text');
const { separateNotified } = require('../utils');
const logger = require('./winston');
const { dueDateTemplate, failListTemplate } = require('../htmlTemplates');
const { updateCellValue } = require('./sheets');

// Nodemailer Setup
const transporter = nodemailer.createTransport({
    host: process.env.smtpHost,
    port: process.env.smtpPort,
    secure: true, // Use true for port 465, false for port 587
    auth: {
        user: process.env.smtpUsername,
        pass: process.env.smtpPassword,
    },
    pool: true,
    maxConnections: 1,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 1,
    tls: {
        // Accept self-signed or invalid certificates
        rejectUnauthorized: false,
    },
});

async function prepareAndSendDueDateEmail(combinedData, baseUrl) {
    const failedEmails = [];
    for (const companyName in combinedData) {

        const companyData = combinedData[companyName];

        // Get the email address from the first element of the array. It is certain that there is at least one element in the array.
        const emailAddress = companyData[0]['Email Address'].value; 

        // Generate the URL for the terminals selection list for subscription renewal.
        const URL = baseUrl + "/terminals?company=" + encodeURIComponent(companyName); 
        
        const emailBody = dueDateTemplate(URL);

        // Send email
        const { ok, error } = await sendEmail(emailAddress, 'Terminal Renewal Reminder', emailBody);

        if (!ok) {

            failedEmails.push({ companyName, emailAddress, error });

            if (error && (error.code === 'EAUTH' || error.responseCode === 535)) {
                logger.error('Auth error detected; stopping further sends.');
                break;
            } else {
                logger.error(`Failed to send email to ${emailAddress}:`, error);
            }

        } else {

            // If the email is sent successfully, update the Email Sent column accordingly. 
            // If there is any failure in updating the sheet, log the error and continue with the next email sending without stopping the whole process.
            const { notNotified: toUpdateFirstEmailNotified, alreadyNotified: toUpdateSecondEmailNotified } = separateNotified(companyData, "First Email Sent");

            for (const recipient of toUpdateFirstEmailNotified) {
                const updateResult = await updateCellValue('First Email Sent', recipient, 'Yes');

                if (!updateResult.ok) {
                    logger.error(`Error updating First Email Sent for ${recipient['Company Name'].value}:`, updateResult.error);
                }
            }

            for (const recipient of toUpdateSecondEmailNotified) {
                const updateResult = await updateCellValue('Second Email Sent', recipient, 'Yes');

                if (!updateResult.ok) {
                    logger.error(`Error updating Second Email Sent for ${recipient['Company Name'].value}:`, updateResult.error);
                }
            }

        }
    }

    // Send the alert email to customer service if there is any failure in sending email, 
    // with the list of failed emails and the corresponding error message.
    if (failedEmails.length > 0) {

        logger.warn('Some emails failed to send:', failedEmails);
        const failBody = failListTemplate(failedEmails);
        const result = await sendEmail("customerservice@arvending.com.my", '|AR VENDING| Failed Email List', failBody);

        if (!result.ok) {
            logger.error('Failed to send email list to customer service.');
        } else {
            logger.info('Failed email list sent to customer service.');
        }

    }

    return;
}

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

        logger.info(`Message sent to ${to}: ${info.messageId}`);

        return { ok: true, messageId: info.messageId };
    } catch (error) {
        logger.error(`Error sending to ${to}:`, error);
        return { ok: false, error: error };
    }
}

module.exports = { sendEmail, prepareAndSendDueDateEmail };