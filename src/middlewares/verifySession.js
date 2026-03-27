const { getSheetData } = require('../utils/services/sheets');
const { getCombinedPipelineByDueDate, groupByCompany } = require('../utils/dataProcessors');
const { verifyJWT } = require('../utils/utils');
const logger = require('../utils/services/winston');

async function verifySession(req, res, next) {

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

    const user = req.session.users ? req.session.users[companyName] : null;

    
    if (user && user.isVerified) {
        try {
            if (!user.data) {
                const sheetData = await getSheetData();
                const combinedData = getCombinedPipelineByDueDate(sheetData.data.valueRanges, true, ["firstEmailNotNotified", "firstEmailNotified"]);
                const groupedData = groupByCompany(combinedData);

                const companyData = groupedData[companyName];
                user.data = companyData;
            }

            return next();

        } catch (e) {
            logger.error('Error in verifySession middleware:', e);
            const err = new Error("An error occurred while processing the request.");
            err.status = 500;
            return next(err);
        }

    } else {

        try {
            const sheetData = await getSheetData();
            const combinedData = getCombinedPipelineByDueDate(sheetData.data.valueRanges, true, ["firstEmailNotNotified", "firstEmailNotified"]);
            const groupedData = groupByCompany(combinedData);
            const companyData = groupedData[companyName];
            
            if (!companyData) {
                const err = new Error("Company data not found for the provided token.");
                err.status = 404;
                return next(err);
            }

            const email = companyData.length > 0 ? companyData[0]['Email Address'].value : originalEmail;
            const maskedEmail = email.replace(/(.{2}).+(@.+)/, '$1****$2');

            req.session.users = req.session.users || {};
            req.session.users[companyName] = { isVerified: false, data: companyData, email };
            return res.render('otp', { companyName, token, maskedEmail });
        } catch (e) {
            logger.error('Error fetching sheet data in verifySession middleware:', e);
            const err = new Error("An error occurred while fetching data.");
            err.status = 500;
            return next(err);
        }

    }

}

module.exports = {
    verifySession
};