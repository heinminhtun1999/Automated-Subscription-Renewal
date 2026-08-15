const logger = require('../utils/services/winston');
const { getMachineByDaysLeft, updateMultipleMachines } = require('../repositories/machineRepository');
const { sendEmail } = require('../utils/services/nodemailer');
const { machineDeactivationNotificationTemplate } = require('../utils/htmlTemplates');

async function handleExpiredMachines() {
    try {
        const machines = getMachineByDaysLeft(-1, true, 'active');

        // Data (machine ids) to process database operations
        const machineIdsToRemoveProcessId = [];
        const machineIdsToMarkInactive = [];

        // Data for the email template
        const machinesToMarkInactive = [];
        const machinesAllowedForRenewalAfterExpire = [];

        machines.forEach(m => {
            if (!m.allow_after_expired) {
                if (m.renewal_process_id) {
                    machineIdsToRemoveProcessId.push(m.id);
                }
                machineIdsToMarkInactive.push(m.id);
                machinesToMarkInactive.push(m);
            } else {
                machinesAllowedForRenewalAfterExpire.push(m);
            }
        });

        if (machineIdsToRemoveProcessId.length > 0) {
            updateMultipleMachines(machineIdsToRemoveProcessId, { renewal_process_id: null });
            logger.info(`Removed renewal process ID from ${machineIdsToRemoveProcessId.length} expired machines.`);
        }

        if (machineIdsToMarkInactive.length > 0 || machinesAllowedForRenewalAfterExpire.length > 0) {
            updateMultipleMachines(machineIdsToMarkInactive, { status: 'inactive' });
            logger.info(`${machineIdsToMarkInactive.length} machines have been automatically set to inactive after the expiration.`);

            const emailBody = machineDeactivationNotificationTemplate(machinesToMarkInactive, machinesAllowedForRenewalAfterExpire);
            await sendEmail(process.env.CS_EMAIL, 'Expired machines notices', emailBody, 'Machine Deactivation Email', [ 'chiew@arvending.com.my', 'shirly@arvending.com.my' ]);
        }
    } catch (e) {
        throw new Error(`\nError in handleExpiredMachines cron job: ${e.stack || e.message || e}`);
    }
}

module.exports = handleExpiredMachines;