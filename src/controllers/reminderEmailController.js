// Module Imports
const path = require('path');
const dotenv = require('dotenv');
const uuid = require('uuid');

const logger = require('../utils/services/winston');
const db = require('../db/db');
const runReminderEmailJob = require('../utils/services/reminderEmail');
const { getMachineByDaysLeftAndCustomerId, updateMachine } = require('../repositories/machineRepository');
const { getCustomerById } = require('../repositories/customerRepository');
const { generateJWT } = require('../utils/utils');
const { dueDateTemplate, renewalProcessUpsertFailureTemplate } = require('../utils/htmlTemplates');
const { insertEmail, updateEmail } = require('../repositories/emailsRepository');
const { insertEmailMachine } = require('../repositories/emailMachinesRepository');
const { sendEmail } = require('../utils/services/nodemailer');

// Ensure environment variables are loaded from .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });

async function reminderEmailController(req, res) {
    try {
        const result = await runReminderEmailJob();

        if (!result.success) {
            throw new Error(result.error)
        }
        logger.info('Reminder Emails job successfullly processed via controller.')
        return res.send(result);
    } catch (error) {
        logger.error('Error in reminderEmailController. Error: ', error);
        return res.status(500).json({ success: false, message: error.message || 'An error occurred while processing the request.' });
    }
};

async function manualReminderEmailController(req, res) {
    const { customer_id } = req.body;
    
    if (!customer_id) {
        return res.status(400).json({ success: false, message: "Customer ID is required." });
    }
    
    try {
        
        const customer = getCustomerById(customer_id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer with this id does not exist." });
        }

        const machines = getMachineByDaysLeftAndCustomerId(45, customer_id, true, true);
        if (machines.length == 0) {
            return res.status(404).json({ success: false, message: "No machines are due for renewal within the next 45 days." });
        }

        // Separate the array by any email been sent or not
        const { remindedMachines, notRemindedMachines } = machines.reduce((acc, machine) => {
            if (!machine.renewal_process_id) {
                acc.notRemindedMachines.push(machine);
            } else {
                acc.remindedMachines.push(machine);
            }
            return acc
        }, { remindedMachines: [], notRemindedMachines: [] });

        console.log(remindedMachines, notRemindedMachines)

        // ========== Send email for the machines which are within 45 days of subscription expiration ============
        const emailAddress = customer.email;
        const body = { customer_id: customer.id };
        
        // Generate the URL for the terminals selection list for subscription renewal.
        const token = generateJWT(body);
        const URL = process.env.PUBLIC_BASE_URL + "/machines?token=" + token;

        const emailBody = dueDateTemplate(URL);

        const insertedEmail = insertEmail(emailAddress, customer_id, 'pending');

        // Send Email
        const { ok, error, messageId } = await sendEmail(emailAddress, 'Terminal Renewal Reminder', emailBody, 'Due Date Reminder', [process.env.CS_EMAIL]);

        updateEmail(insertedEmail.lastInsertRowid, { status: ok ? 'sent' : 'failed', nodemailer_message_id: messageId, failed_reason: error ? (error.message || 'Unknown error') : null });

        if (!ok) {
            logger.error(`Failed to manually send due date reminder email to ${emailAddress}: ${error ? error.message : 'Unknown Error'}`);
            throw new Error(error.message || 'Unknown Error');
        }

        // Insert renewal process id to the machine which have not been sent an email previously
        if (notRemindedMachines.length > 0) {
            const errorMachines = [];
            for (const machine of notRemindedMachines) {
                try {

                    db.transaction(() => {
                        const renewalProcessId = uuid.v4();
                        insertEmailMachine(machine.id, insertedEmail.lastInsertRowid, renewalProcessId);
                        updateMachine(machine.id, { renewal_process_id: renewalProcessId });
                    }).immediate();

                } catch (error) {
                    logger.error(`Error occured when inserting process renewal id to freshly sent email in manual send email. \
                        Affected machine id: ${machine.id} \
                        Error: ${error.message}`);
                    errorMachines.push({ machine_id: machine.id, error: error.message || 'Unknown Error' });
                }
            }

            if (errorMachines.length > 0) {
                const emailBody2 = renewalProcessUpsertFailureTemplate(customer.company_name, errorMachines);
                const { ok, error } = await sendEmail(process.env.DEV_EMAIL, '|AR VENDING| Error occured in inserting renewal process id after sending email manually.', emailBody2);
                if (!ok) {
                    logger.error(`Failed to notify to developer on renewal process id insertion failure in manual email reminder.`)
                }
                return res.status(500).json({ success: false, message: 'Email is sent to the customer. However, there was an error when performing database operation. Notify the developer.' });
            }
        }

        return res.status(200).json({ success: true, message: "Email has been sent successfully." }); 

    } catch (error) {
        logger.error('Error in manualReminderEmailController. Error: ', error);
        return res.status(500).json({ success: false, message: `Failed to send reminder email. Please try again later. Error: ${error.message}` })
    }
}

module.exports = {
    reminderEmailController,
    manualReminderEmailController
};