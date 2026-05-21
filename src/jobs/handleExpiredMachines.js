const db = require('../db/db');
const logger = require('../utils/services/winston');
const { getMachineByDaysLeft, updateMultipleMachines } = require('../repositories/machineRepository');

async function handleExpiredMachines() {
    try {
        const machines = getMachineByDaysLeft(-1, true);
        const machineIds = machines.filter(machine => machine.renewal_process_id).map(machine => machine.id);
        if (machineIds.length > 0) {
            updateMultipleMachines(machineIds, { renewal_process_id: null, status: 'inactive' });
            logger.info(`Removed renewal process ID from ${machineIds.length} expired machines.`);
        }
    } catch (e) {
        logger.error(`Error removing renewal process ID: ${e.message}`);
    }
}

module.exports = handleExpiredMachines;