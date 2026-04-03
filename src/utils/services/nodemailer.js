const nodemailer = require('nodemailer');
const { convert } = require('html-to-text');
const { separateNotified } = require('../dataProcessors');
const logger = require('./winston');
const { dueDateTemplate, failListTemplate } = require('../htmlTemplates');
const { updateCellValue } = require('./sheets');
const { generateJWT } = require('../utils');

// Nodemailer Setup
const reminderTransporter = nodemailer.createTransport({
    host: process.env.smtpHost,
    port: process.env.smtpPort,
    secure: true, // Use true for port 465, false for port 587
    auth: {
        user: process.env.smtpUsername,
        pass: process.env.smtpPassword,
    },
    pool: true,
    maxConnections: 1,
    maxMessages: 200,
    rateDelta: 1000,
    rateLimit: 1,
    tls: {
        // Accept self-signed or invalid certificates
        rejectUnauthorized: process.env.NODE_ENV === 'production' // Only reject unauthorized in production,
    },
});

// Secondary transporter for non-reminder emails.
const otherTransporter = nodemailer.createTransport({
    host: process.env.smtpHost,
    port: process.env.smtpPort,
    secure: true, // Use true for port 465, false for port 587
    auth: {
        user: process.env.smtpUsername,
        pass: process.env.smtpPassword,
    },
    pool: true,
    maxConnections: 2,
    maxMessages: 100,
    tls: {
        // Accept self-signed or invalid certificates
        rejectUnauthorized: process.env.NODE_ENV === 'production' // Only reject unauthorized in production,
    },
});



// Send due-date reminders and update sheet notification flags.
async function prepareAndSendDueDateEmail(combinedData, baseUrl) {
    const failedEmails = [];
    for (const companyName in combinedData) {

        const companyData = combinedData[companyName];

        // Get the email address from the first element of the array. It is certain that there is at least one element in the array.
        const emailAddress = companyData[0]['Email Address'].value;

        // Generate the URL for the terminals selection list for subscription renewal.
        const body = {
            companyName: companyName,
            originalEmail: emailAddress,
        }
        const token = generateJWT(body);
        const URL = baseUrl + "/terminals?token=" + token;

        const emailBody = dueDateTemplate(URL, numTerminals = companyData.length);

        // Send email
        const { ok, error } = await sendEmail(emailAddress, 'Terminal Renewal Reminder', emailBody, 'Due Date Reminder');

        if (!ok) {

            const terminals = companyData.map(data => data['Sheet Name']).reduce((acc, sheet) => {
                if (!acc.includes(sheet)) {
                    acc.push(sheet);
                }
                return acc;
            }, []);

            const companyDataWithError = {
                "Date/Time": new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" }),
                "Company Name": companyName,
                "Email Address": emailAddress,
                "Terminals": terminals.join(', '),
                "Error Message": error.message || 'Unknown error'
            }

            failedEmails.push(companyDataWithError);

            if (error && (error.code === 'EAUTH' || error.responseCode === 535)) {
                logger.error('Auth error detected; stopping further sends.');
                break;
            } else {
                logger.error(`Failed to send due date reminder email to ${emailAddress}:`, error);
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
        const result = await sendEmail("customerservice@arvending.com.my", '|AR VENDING| Failed Email List', failBody, 'Failed Email List');

        if (!result.ok) {
            logger.error('Failed to send failed email list to customer service.');
        } else {
            logger.info('Failed email list sent to customer service.');
        }

    }

    return;
}

// Send an email via appropriate transporter and return status.
async function sendEmail(to, subject, body, topic = 'General') {
    try {

        const textBody = convert(body, { wordwrap: 130 });

        let info;

        if (topic === 'Due Date Reminder') {

            info = await reminderTransporter.sendMail({
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

        } else {
            info = await otherTransporter.sendMail({
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
        }


        logger.info(`${topic} email sent to ${to}: ${info.messageId}`);

        return { ok: true, messageId: info.messageId };
    } catch (error) {
        logger.error(`Error sending ${topic} email to ${to}:`, error);
        return { ok: false, error: error };
    }
}

module.exports = { sendEmail, prepareAndSendDueDateEmail };