const db = require('../db/db');
const logger = require('../utils/services/winston');
const { getMachineByDaysLeft, updateMultipleMachines } = require('../repositories/machineRepository');
const { sendEmail } = require("../utils/services/nodemailer");
const { machineDeactivationNotificationTemplate } = require("../utils/htmlTemplates");

async function handleExpiredMachines() {
    try {
        const machines = getMachineByDaysLeft(0, true, 'active');

        const machineIdsToRemoveProcessId = [];
        const machineIdsToMarkInactive = [];
        machines.forEach(m => {
            if (m.renewal_process_id) machineIdsToRemoveProcessId.push(m.id);
            machineIdsToMarkInactive.push(m.id);
        })

        if (machineIdsToRemoveProcessId.length > 0) {
            updateMultipleMachines(machineIdsToRemoveProcessId, { renewal_process_id: null });
            logger.info(`Removed renewal process ID from ${machineIdsToRemoveProcessId.length} expired machines.`);
        }

        if (machineIdsToMarkInactive.length > 0) {
            updateMultipleMachines(machineIdsToMarkInactive, { status: 'inactive' });
            logger.info(`${machineIdsToMarkInactive.length} machines have been automatically set to inactive after the expiration.`);
            
            const emailBody = machineDeactivationNotificationTemplate(machines);
            await sendEmail(process.env.CS_EMAIL, '|AR VENDING| Expired machines notices', emailBody)
        }
    } catch (e) {
        logger.error(`Error in handleExpiredMachines cron job: ${e.stack || e.message || e}`);
    }
}

module.exports = handleExpiredMachines;