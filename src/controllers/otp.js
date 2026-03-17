const { generateOTP } = require('../utils/utils');
const logger = require('../utils/services/winston');
const { sendEmail } = require('../utils/services/nodemailer');
const { otpTemplate } = require('../utils/htmlTemplates');

async function generateAndStoreOTP(req, res) {
    const data = req.session.data;

    if (!data) {
        logger.error('Session data not found when generating OTP.');
        return res.status(500).json({ success: false, message: 'Session data not found.' });
    }

    const email = data[0]['Email Address']?.value;
    const maskedEmail = email?.replace(/(.{2}).+(@.+)/, '$1****$2');

    if (!email) {
        logger.error('Email address not found in session data.');
        return res.status(500).json({ success: false, message: 'Email address not found.' });
    }

    try {
        const otp = generateOTP();

        const emailBody = otpTemplate(maskedEmail, otp);
        const response = await sendEmail(email, 'Your OTP Code', emailBody);

        if (!response.ok) {
            throw new Error('Failed to send OTP email.' + (response.error ? `Error: ${response.error.message}` : 'No additional error information.'));
        } else {
            req.session.otp = {
                code: otp,
                expiresAt: Date.now() + 5 * 60 * 1000 // OTP expires in 5 minutes
            };
            return res.json({ success: true });
        }

    } catch (e) {
        logger.error('Error occurred while sending email:', e);
        return res.status(500).json({ success: false, message: 'Error occurred while sending email.' });
    }
}

function verifyOTP(req, res) {
    const { otp } = req.body;
    const { code, expiresAt } = req.session.otp || {};

    if (!code || !expiresAt) {
        return res.status(400).json({ success: false, message: 'OTP not found. Please request a new OTP.' });
    }

    if (Date.now() > expiresAt) {
        delete req.session.otp;
        return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    if (otp !== code) {
        return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
    }

    req.session.isVerified = true;
    delete req.session.otp;
    return res.json({ success: true });
}

module.exports = { generateAndStoreOTP, verifyOTP };