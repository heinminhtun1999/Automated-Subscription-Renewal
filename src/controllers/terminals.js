const {  verifyJWT } = require("../utils/utils");
const { uid } = require("../utils/dataProcessors");
const { SHEET_CONFIGS } = require("../utils/constants");

const terminalsController = async (req, res) => {
    
    const { token } = req.query;

    if (!token) {
        const err = new Error("Requested resource was not found.");
        err.status = 404;
        return next(err);
    }

    const { valid, decoded, error } = verifyJWT(token);

    const data = req.session?.users[decoded.companyName]?.data || [];

    const sheetMap = {
        'beep': 'Beep QR & E-Wallet Device',
        'mi20': 'MI20',
        'arv2.5': 'ARV2.5',
        'u20': 'U20',
        'arvdn': 'ARVDN Machine'
    }
    
    const formattedData = data.map(item => {
        const deviceType = sheetMap[item['Sheet Name']];
        const terminalId = uid(item);
        const companyName = item['Company Name'].value || "Unknown Company";
        const renewalFees = item['Renewal Fee (RM)'].value || "N/A";
        const dateNames = SHEET_CONFIGS.filter(config => config.sheetKey === item['Sheet Name'])[0];
        const endDate = item[dateNames.endDateColumn].value || "N/A";
        const renewalEndDate = item[dateNames.renewalEndDateColumn].value || "N/A";

        const timeLeft = endDate ? new Date(endDate).getTime() - Date.now() : new Date(renewalEndDate).getTime() - Date.now();
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