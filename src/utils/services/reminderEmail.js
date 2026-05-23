// Module Imports
const path = require('path');
const dotenv = require('dotenv');
const { groupByCompany } = require('../dataProcessors');
const { prepareAndSendDueDateEmail } = require('./nodemailer');
const { normalizeDate } = require('../utils');
const { getMachineByDaysLeft } = require('../../repositories/machineRepository');
const { getAllEmailMachines } = require('../../repositories/emailMachinesRepository');
const logger = require('./winston');

// Ensure environment variables are loaded
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });

// Trigger reminder emails for upcoming renewals and return grouped data.
const reminderEmailJob = async () => {

    try {
        const machinesDueForRenewal = getMachineByDaysLeft(45);
        const emailMachines = getAllEmailMachines();

        const map = new Map();
        emailMachines.forEach(em => {
            const key = em.renewal_process_id;
            map.set(key, em);
        })

        const separated = machinesDueForRenewal.reduce((acc, machine) => {
            const foundEmailMachine = machine.renewal_process_id ? map.get(machine.renewal_process_id) : null;

            if (foundEmailMachine) {
                if (!foundEmailMachine.second_email_id) {
                    const daysLeft = Math.floor((new Date(machine.end_date) - new Date()) / (1000 * 60 * 60 * 24));
                    if (daysLeft <= 7) {
                        acc.secondEmailToBeSent.push({ ...machine, emailMachine: foundEmailMachine });
                    }
                }
            } else {
                acc.firstEmailNotSent.push(machine);
            }

            return acc;
        }, { firstEmailNotSent: [], secondEmailToBeSent: [] });

        const flattenedData = [...separated.firstEmailNotSent, ...separated.secondEmailToBeSent];

        const groupedData = groupByCompany(flattenedData);

        await prepareAndSendDueDateEmail(groupedData);

        return { success: true, len: machinesDueForRenewal.length, machines: machinesDueForRenewal, separated };

    } catch (error) {
        logger.error('Error in reminderEmail:', error.stack || error);
        return { success: false, len: 0, machines: [], separated:[] };
    }


};

module.exports = reminderEmailJob;