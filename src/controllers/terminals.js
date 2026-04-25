const { verifyJWT } = require("../utils/utils");
const { uid, getGroupedData } = require("../utils/dataProcessors");
const { SHEET_CONFIGS } = require("../utils/constants");

// Render terminal selection list for a verified company token.
const terminalsController = async (req, res) => {

    const { token } = req.query;

    if (!token) {
        const err = new Error("Requested resource was not found.");
        err.status = 404;
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

    const { companyName, originalEmail } = decoded;

    const groupedData = await getGroupedData(true, ["firstEmailNotNotified", "firstEmailNotified"]);
    const data = groupedData[companyName];
    req.session.data = data; // Store company-specific data in session for later use during payment processing  

    // Friendly device names for UI display.
    const sheetMap = {
        'beep': 'Beep QR & E-Wallet Device',
        'mi20': 'MI20',
        'arv2.5': 'ARV2.5',
        'u20': 'U20',
        'arvdn': 'ARVDN Machine'
    }

    // Normalize sheet rows into UI-ready objects.
    const formattedData = data.map(item => {
        const deviceType = sheetMap[item['Sheet Name']];
        const terminalId = uid(item);
        const companyName = item['Company Name'].value || "Unknown Company";
        const renewalFees = item['Renewal Fee (RM)'].value || "N/A";
        const dateNames = SHEET_CONFIGS.filter(config => config.sheetKey === item['Sheet Name'])[0];
        const endDate = item[dateNames.endDateColumn].value || "N/A";
        const renewalEndDate = item[dateNames.renewalEndDateColumn].value || "N/A";

        // Compute days remaining, favoring renewal end date when available.
        const timeLeft = renewalEndDate && new Date(renewalEndDate) != 'Invalid Date' ?
            new Date(renewalEndDate).getTime() - Date.now() :
            endDate ? new Date(endDate).getTime() - Date.now() : 0; // Use renewal end date if available, otherwise use end date, if neither is available, set to 0
        const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
        const daysLeftText = daysLeft == 0 ? "Expires Today" : daysLeft < 0 ? "Expired" : `${daysLeft} day(s)`;

        return {
            terminalId,
            deviceType,
            companyName,
            renewalFees,
            daysLeft: daysLeftText
        }
    }).sort((a, b) => a.daysLeft === 'Expired' ? 1 : b.daysLeft === 'Expired' ? -1 : parseInt(a.daysLeft) - parseInt(b.daysLeft)); // Sort by days left, with expired terminals at the end

    return res.render('terminals', { data: formattedData });
}

module.exports = terminalsController;