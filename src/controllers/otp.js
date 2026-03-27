const { generateOTP, generateVCode } = require('../utils/utils');
const logger = require('../utils/services/winston');
const { sendEmail } = require('../utils/services/nodemailer');
const { otpTemplate } = require('../utils/htmlTemplates');
const { getOTPEntry, insertOTPEntry, updateOTPEntry, deleteOTPEntry } = require('../repositories/otpRepository');


async function generateAndStoreOTP(req, res) {

    const companyName = req.body.companyName;
    const user = req.session?.users[companyName]
    const email = user?.email;

    if (!email) {
        return res.status(500).json({
            success: false,
            message: 'Failed to request OTP. Please try refreshing the page.'
        });
    }
    
    try {

        const otpEntry = getOTPEntry({ companyName, email }) || {};


        const now = Date.now();
        if (otpEntry.generate_blocked_until && now < otpEntry.generate_blocked_until) {
            return res.status(429).json({
                success: false,
                message: 'Too many OTP attempts. Please try again later.'
            });
        }

        if (otpEntry.generate_blocked_until) {
            updateOTPEntry(companyName, email, otpEntry.id, { generate_blocked_until: null });
        }

        if (otpEntry.expires_at && now > new Date(otpEntry.expires_at).getTime()) {
            updateOTPEntry(companyName, email, otpEntry.id, { generate_attempts: 0 });
        }

        if (otpEntry.generate_attempts && otpEntry.generate_attempts >= 5) {
            updateOTPEntry(companyName, email, otpEntry.id,
                {
                    generate_attempts: 0,
                    code_hash: null,
                    generate_blocked_until: Date.now() + 60 * 1000 * 15
                }
            ) // Reset attempts after blocking

            return res.status(429).json({
                success: false,
                message: 'Too many OTP attempts. Please try again later.'
            });
        }

        const maskedEmail = email.replace(/(.{2}).+(@.+)/, '$1****$2');
        const otp = generateOTP();
        const otpHash = generateVCode(otp);

        const emailBody = otpTemplate(maskedEmail, otp);
        const response = await sendEmail(email, 'Your OTP Code', emailBody, 'OTP');

        if (!response.ok) {

            throw new Error('Failed to send OTP email.' + (response.error ? `Error: ${response.error.message}` : 'No additional error information.'));

        } else {

            const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // OTP valid for 5 minutes

            if (Object.keys(otpEntry).length > 0) {
                console.log("otpEntry:", otpEntry);
                updateOTPEntry(companyName, email, otpEntry.id, {
                    code_hash: otpHash,
                    expires_at: expires, // OTP valid for 5 minutes
                    generate_attempts: otpEntry.generate_attempts + 1
                });

            } else {
                insertOTPEntry(companyName, email, otpHash, expires);
            }


            return res.status(200).json({ success: true });
        }

    } catch (e) {
        logger.error('Error occurred while preparing OTP: ', e);
        return res.status(500).json({
            success: false,
            message: 'Error occurred while sending OTP email.'
        });
    }
}

function verifyOTP(req, res) {
    const { otp, companyName } = req.body;
    const user = req.session?.users[companyName];
    const email = user?.email;

    if (!email || !otp || !companyName) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields. Please provide company name and OTP.'
        });
    }

    try {

        const otpEntry = getOTPEntry({ companyName, email });

        if (!otpEntry.code_hash) {
            return res.status(400).json({
                success: false,
                message: 'OTP not found. Please request a new OTP.'
            });
        }

        const now = Date.now();

        if (now < new Date(otpEntry.verify_blocked_until).getTime()) {
            return res.status(429).json({
                success: false,
                message: 'Too many incorrect OTP attempts. Please try again later.'
            });
        }

        if (otpEntry.verify_blocked_until) {
            updateOTPEntry(companyName, email, otpEntry.id, { verify_blocked_until: null });
        }

        if (otpEntry.verify_attempts && otpEntry.verify_attempts >= 5) {
            updateOTPEntry(companyName, email, otpEntry.id,
                {
                    verify_attempts: 0,
                    verify_blocked_until: Date.now() + 15 * 60 * 1000
                }
            )

            return res.status(429).json({
                success: false,
                message: 'Too many incorrect OTP attempts. Please try again later.'
            });
        }

        if (now > new Date(otpEntry.expires_at).getTime()) {
            updateOTPEntry(companyName, email, otpEntry.id, { verify_attempts: otpEntry.verify_attempts + 1 });

            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new OTP.'
            });
        }

        if (generateVCode(otp) !== otpEntry.code_hash) {
            updateOTPEntry(companyName, email, otpEntry.id, { verify_attempts: otpEntry.verify_attempts + 1 });
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP. Please check and try again.'
            });
        }

        user.isVerified = true;

        deleteOTPEntry(companyName, email, otpEntry.id);

        return res.json({ success: true });

    } catch (e) {
        logger.error('Error occurred while verifying OTP: ', e);
        return res.status(500).json({
            success: false,
            message: 'Error occurred while verifying OTP.'
        });
    }
}

module.exports = { generateAndStoreOTP, verifyOTP };