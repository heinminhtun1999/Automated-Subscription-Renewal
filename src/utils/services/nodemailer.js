const nodemailer = require('nodemailer');
const uuid = require('uuid');
const logger = require('./winston');
const db = require('../../db/db');
const { convert } = require('html-to-text');
const { dueDateTemplate, failListTemplate } = require('../htmlTemplates');
const { generateJWT } = require('../utils');
const { insertEmailMachine, updateEmailMachine } = require('../../repositories/emailMachinesRepository');
const { updateMachine } = require('../../repositories/machineRepository');
const { insertEmail, updateEmail } = require('../../repositories/emailsRepository');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });

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



// Send due-date reminders and insert new email records if first email does not exist; otherwise update second email id.
async function prepareAndSendDueDateEmail(combinedData) {
    const failedEmails = [];

    // Using company name because data is grouped by company name which 
    // will be used in the email body and later will be render in the machines selection page. It is assumed that there will not be duplicate company names in the database. If there are duplicate company names, it will not affect the email sending and the email machine upsert process, but it may cause confusion in the email body and the machines selection page. If there are duplicate company names, it is recommended to use unique identifier such as customer ID for grouping data and generating email content.
    for (const companyName in combinedData) {

        const companyData = combinedData[companyName];

        // Get the email address from the first element of the array. It is certain that there is at least one element in the array.
        const emailAddress = companyData[0].email;

        // Generate the URL for the terminals selection list for subscription renewal.
        const body = {
            customer_id: companyData[0].customer_id
        }
        const token = generateJWT(body);
        const URL = process.env.PUBLIC_BASE_URL + "/machines?token=" + token;

        const emailBody = dueDateTemplate(URL);

        try {
            const insertedEmail = insertEmail(emailAddress, companyData[0].customer_id, 'pending');

            // Send email
            const { ok, error, messageId } = await sendEmail(emailAddress, 'Terminal Renewal Reminder', emailBody, 'Due Date Reminder');

            updateEmail(insertedEmail.lastInsertRowid, { status: ok ? 'sent' : 'failed', nodemailer_message_id: messageId, failed_reason: error ? (error.message || 'Unknown error') : null });

            if (!ok) {

                // Taking out machine types for better error monitoring and debugging.
                const machineTypes = companyData.map(data => data.machine_type_name).reduce((acc, machineTypeName) => {
                    if (!acc.includes(machineTypeName)) {
                        acc.push(machineTypeName);
                    }
                    return acc;
                }, []);

                const companyDataWithError = {
                    "Date/Time": new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" }),
                    "Company Name": companyName,
                    "Email Address": emailAddress,
                    "Machine Types": machineTypes.join(', '),
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

                // If the email is sent successfully, perform upsert. 
                // If there is any failure in updating the sheet, log the error and continue with the next email sending without stopping the whole process.
                for (const row of companyData) {
                    const isFirstEmailExist = row.emailMachine && row.renewal_process_id && row.emailMachine.first_email_id;

                    try {
                        if (isFirstEmailExist) {
                            updateEmailMachine(row.emailMachine.id, { second_email_id: insertedEmail.lastInsertRowid });
                        } else {
                            const renewalProcessId = uuid.v4();
                            db.transaction(() => {
                                insertEmailMachine(row.id, insertedEmail.lastInsertRowid, renewalProcessId);
                                updateMachine(row.id, { renewal_process_id: renewalProcessId });
                            }).immediate();
                        }
                    } catch (error) {
                        logger.error(`Failed to upsert email machine for ${emailAddress}:`, error);

                    }
                }
            }

        } catch (error) {
            logger.error(`Failed to insert email record for ${emailAddress}:`, error);
        }
    }

    // Send the alert email to customer service if there is any failure in sending email, 
    // with the list of failed emails and the corresponding error message.
    if (failedEmails.length > 0) {

        logger.warn('Some emails failed to send:', failedEmails);
        const failBody = failListTemplate(failedEmails);
        const result = await sendEmail(process.env.CS_EMAIL, '|AR VENDING| Failed Email List', failBody, 'Failed Email List', [process.env.DEV_EMAIL]);

        if (!result.ok) {
            logger.error('Failed to send failed email list to customer service.');
        } else {
            logger.info('Failed email list sent to customer service.');
        }

    }

    return;
}

// Send an email via appropriate transporter and return status.
async function sendEmail(to, subject, body, topic = 'General', cc = null) {
    try {

        const textBody = convert(body, { wordwrap: 130 });

        let info;

        const emailOptions = {
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
        }

        if (cc) {
            emailOptions.cc = cc;
        }

        if (topic === 'Due Date Reminder') {
            info = await reminderTransporter.sendMail(emailOptions);

        } else {
            emailOptions.subject = "[AR Vending] " + emailOptions.subject;
            info = await otherTransporter.sendMail(emailOptions);
        }

        logger.info(`${topic} email sent to ${to}: ${info.messageId}`);

        return { ok: true, messageId: info.messageId };
    } catch (error) {
        logger.error(`Error sending ${topic} email to ${to}:`, error);
        return { ok: false, error: error };
    }
}

module.exports = { sendEmail, prepareAndSendDueDateEmail };