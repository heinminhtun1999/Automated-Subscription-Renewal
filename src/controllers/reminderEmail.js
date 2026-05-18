// Module Imports
const { getGroupedData, groupByCompany } = require('../utils/dataProcessors');
const { prepareAndSendDueDateEmail } = require('../utils/services/nodemailer');
const { getSheetData } = require('../utils/services/sheets');
const { normalizeDate } = require('../utils/utils');
const { getMachineByDaysLeft } = require('../repositories/machineRepository');
const { getAllEmailMachines } = require('../repositories/emailMachinesRepository');
const logger = require('../utils/services/winston');
const e = require('express');

// Trigger reminder emails for upcoming renewals and return grouped data.
const reminderEmailController = async (req, res) => {

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

        return res.send({ len: machinesDueForRenewal.length, machines: machinesDueForRenewal, separated });
        // const groupedData = await getGroupedData(false, ["firstEmailNotNotified", "secondEmailNotNotified"]);

        // // Send email to the customers with the list of terminals that are due for renewal, 
        // // and update the notified column in the sheet accordingly. 
        // // If there is any failure in sending email, log the error and send a summary email to customer service.
        // await prepareAndSendDueDateEmail(groupedData, `${req.protocol}://${req.get('host')}`);

        // return res.send(groupedData);
    } catch (error) {
        logger.error('Error in reminderEmailController:', error);
        return res.status(500).send('An error occurred while processing the request.');
    }


};

module.exports = reminderEmailController;