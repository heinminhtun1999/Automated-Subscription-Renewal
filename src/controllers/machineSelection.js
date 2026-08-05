const { verifyJWT } = require("../utils/utils");
const { uid } = require("../utils/dataProcessors");
const { SHEET_CONFIGS } = require("../utils/constants");
const { getMachineByDaysLeftAndCustomerId } = require("../repositories/machineRepository");
const { getCustomerById } = require("../repositories/customerRepository");

// Render terminal selection list for a verified company token.
const machineSelection = async (req, res, next) => {

    const { token } = req.query;

    if (!token) {
        const err = new Error();
        err.status = 401;
        err.title = "Unauthorized"
        err.message = "Unauthorized access. Token is required."
        return next(err);
    }

    const { valid, decoded, error } = verifyJWT(token);

    if (!valid) {
        const err = new Error()
        err.status = 401;
        err.title = "Unauthorized"
        err.details = error
        err.message = "Unauthorized access. Invalid token provided."
        return next(err);
    }

    const { customer_id } = decoded;
    const customer = getCustomerById(customer_id);
    const machinesData = getMachineByDaysLeftAndCustomerId(45, customer_id, true);

    if (!customer) {
        const err = new Error("Requested resource was not found.");
        err.status = 404;
        err.title = "Not Found"
        return next(err);
    }

    if (!machinesData || machinesData.length === 0) {
        const err = new Error("No machines found for the customer.");
        err.status = 404;
        err.title = "Not Found"
        return next(err);
    }

    const formattedData = machinesData.filter(machine => machine.renewal_process_id || machine.days_left <= 0).map(machine => {
        const daysLeft = machine.days_left;
        const daysLeftText = (daysLeft == 0 ? "Expires Today" : daysLeft < 0 ? "Expired" : `${Math.ceil(daysLeft)} day(s)`) ;

        return {
            id: machine.id,
            machine_id: machine.machine_id,
            machine_type_name: machine.machine_type_name,
            days_left: daysLeftText,
            renewal_fees: machine.subscription_fees,
        }
    })
    .sort((a, b) => a.days_left === 'Expired' ? 1 : b.days_left === 'Expired' ? -1 : a.days_left == 'Expires Today' ? -1 : parseInt(a.days_left) - parseInt(b.days_left)); // Sort by days left, with expired terminals at the end
    return res.render('machines', { data: { customer, machines: formattedData } });
}

module.exports = { machineSelection };