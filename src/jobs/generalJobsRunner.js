const handleExpiredMachines = require("./handleExpiredMachines");
const reconcilePayment = require("./reconcilePayment");
const logger = require('../utils/services/winston');

async function runCronJobs() {
    try {
        logger.info("Starting general cron jobs...");
        await handleExpiredMachines();
        await reconcilePayment();
        logger.info("Cron jobs completed successfully.");
    } catch (e) {
        logger.error(`Error running cron jobs: ${e.message}`);
    }
}


module.exports = runCronJobs;
