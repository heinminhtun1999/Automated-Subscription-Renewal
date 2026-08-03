const { generateOTP, generateMd5 } = require('../utils/utils');
const logger = require('../utils/services/winston');
const { sendEmail } = require('../utils/services/nodemailer');
const { otpTemplate } = require('../utils/htmlTemplates');
const { getOTPEntry, insertOTPEntry, updateOTPEntry, deleteOTPEntry } = require('../repositories/otpRepository');


// Generate OTP, rate-limit requests, send email, and persist OTP hash.
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

        // Read existing OTP state for rate-limit and expiry checks.
        let otpEntry = getOTPEntry({ companyName, email }) || {};


        const now = Date.now();
        if (otpEntry.generate_blocked_until && now < otpEntry.generate_blocked_until) {
            return res.status(429).json({
                success: false,
                message: 'Too many OTP attempts. Please try again later.'
            });
        }

        // Clear stale block if time has passed.
        if (otpEntry.generate_blocked_until) {
            updateOTPEntry(companyName, email, otpEntry.id, { generate_blocked_until: null });
        }

        // Reset attempts if previous OTP expired.
        if (otpEntry.expires_at && now > new Date(otpEntry.expires_at).getTime()) {
            updateOTPEntry(companyName, email, otpEntry.id, { generate_attempts: 0 });
        }

        // Apply per-user request throttling.
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

        // Mask email address for UI display.
        const maskedEmail = email.replace(/(.{2}).+(@.+)/, '$1****$2');
        const otp = generateOTP();
        const otpHash = generateMd5(otp);

        const emailBody = otpTemplate(maskedEmail, otp);
        
        const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // OTP valid for 5 minutes

        let otpId;

        // Upsert OTP record (update if exists, insert if new).
        if (Object.keys(otpEntry).length > 0) {
            
            const info = updateOTPEntry(companyName, email, otpEntry.id, {
                code_hash: otpHash,
                expires_at: expires, // OTP valid for 5 minutes
                generate_attempts: otpEntry.generate_attempts + 1
            });
            otpId = info.lastInsertRowid;
        } else {
            const info = insertOTPEntry(companyName, email, otpHash, expires);
            otpId = info.lastInsertRowid;
        }
        
        const response = await sendEmail(email, 'Your OTP Code', emailBody, 'OTP');

        // Roll back OTP record if email delivery fails.
        if (!response.ok) {
            if (otpId > 0) {
                deleteOTPEntry(companyName, email, otpId);
            } else {
                updateOTPEntry(companyName, email, otpEntry.id, {
                    ...otpEntry,
                });
            }
            const err = new Error('Failed to send OTP email. Please try again later.\nIf the issue persists, contact support.');
            throw err;
        }

        return res.status(200).json({ success: true });


    } catch (e) {
        logger.error('Error occurred while preparing OTP: ', e);
        return res.status(500).json({
            success: false,
            message: 'Error occurred while sending OTP email.'
        });
    }
}

// Validate OTP against stored hash with verification throttling.
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

        // Clear stale verification block if time has passed.
        if (otpEntry.verify_blocked_until) {
            updateOTPEntry(companyName, email, otpEntry.id, { verify_blocked_until: null });
        }

        // Apply verification throttling after repeated failures.
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

        // Reject expired OTPs and count as a failed attempt.
        if (now > new Date(otpEntry.expires_at).getTime()) {
            updateOTPEntry(companyName, email, otpEntry.id, { verify_attempts: otpEntry.verify_attempts + 1 });

            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new OTP.'
            });
        }

        // Compare hashed OTP values to avoid storing plaintext.
        if (generateMd5(otp) !== otpEntry.code_hash) {
            updateOTPEntry(companyName, email, otpEntry.id, { verify_attempts: otpEntry.verify_attempts + 1 });
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP. Please check and try again.'
            });
        }

        // Mark the session as verified and remove OTP record.
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