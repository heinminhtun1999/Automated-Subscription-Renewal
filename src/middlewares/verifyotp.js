const { getSheetData } = require('../utils/services/sheets');
const { getCombinedPipelineByDueDate, groupByCID } = require('../utils/dataProcessors');
const logger = require('../utils/services/winston');

async function verifySession(req, res, next) {
    const isVerified = req.session.isVerified;

    const { cid } = req.query;

    if (isVerified) {
        if (!req.session.data) {
            try {
                const sheetData = await getSheetData();
                const combinedData = getCombinedPipelineByDueDate(sheetData.data.valueRanges);
                const groupedData = groupByCID(combinedData);
                req.session.data = groupedData[cid];
                return next();
            } catch (e) {
                logger.error('Error in verifySession middleware:', e);
                return res.status(500).json({ message: "An error occurred while processing the request." });
            }
        }
    } else {
        try {
            const sheetData = await getSheetData();
            const combinedData = getCombinedPipelineByDueDate(sheetData.data.valueRanges);
            const groupedData = groupByCID(combinedData);
            req.session.data = groupedData[cid];
            const maskedEmail = groupedData[cid][0]['Email Address'].value.replace(/(.{2}).+(@.+)/, '$1****$2');
            return res.render('otp', { maskedEmail });
        } catch (e) {
            logger.error('Error in verifySession middleware:', e);
            return res.status(500).json({ message: "An error occurred while processing the request." });
        }
    }

}

module.exports = {
    verifySession
};