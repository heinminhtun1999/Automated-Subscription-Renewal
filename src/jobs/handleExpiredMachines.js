const db = require('../db/db');
const logger = require('../utils/services/winston');
const { getMachineByDaysLeft, updateMultipleMachines } = require('../repositories/machineRepository');
const { sendEmail } = require("../utils/services/nodemailer");
const { machineDeactivationNotificationTemplate } = require("../utils/htmlTemplates");

async function handleExpiredMachines() {
    try {
        const machines = getMachineByDaysLeft(0, true, 'active');
        
        const machineIdsToRemoveProcessId = new Map();
        const machineIdsToMarkInactive = new Map();
        machines.forEach(m => {
            if (!m.allow_after_expired) {
                
                if (m.renewal_process_id) {
                    machineIdsToRemoveProcessId.set(m.id, m)
                };
                machineIdsToMarkInactive.set(m.id,m );
            }
        })
        
        
        if (machineIdsToRemoveProcessId.size > 0) {
            updateMultipleMachines([...machineIdsToRemoveProcessId.keys()], { renewal_process_id: null });
            logger.info(`Removed renewal process ID from ${machineIdsToRemoveProcessId.size} expired machines.`);
        }

        if (machineIdsToMarkInactive.size > 0) {
            updateMultipleMachines([...machineIdsToMarkInactive.keys()], { status: 'inactive' });
            logger.info(`${machineIdsToMarkInactive.size} machines have been automatically set to inactive after the expiration.`);

            const emailBody = machineDeactivationNotificationTemplate([...machineIdsToMarkInactive.values()]);
            await sendEmail(process.env.CS_EMAIL, 'Expired machines notices', emailBody, "Machine Deativation Email", ['chiew@arvending.com.my', 'shirly@arvending.com.my']);
        }
    } catch (e) {
        throw new Error(`\nError in handleExpiredMachines cron job: ${e.stack || e.message || e}`)
    }
}

module.exports = handleExpiredMachines;