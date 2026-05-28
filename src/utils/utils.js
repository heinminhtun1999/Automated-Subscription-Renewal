const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('./services/winston');

// Md5 generator
function generateMd5(string) {
    return crypto.createHash('md5').update(string).digest('hex');
}

// Validate payment signature using configured secret keys.
function validateSkey(data) {
    const firstHashString = `${data.tranID}${data.orderid}${data.status}${process.env.merchantID}${data.amount}${data.currency}`;
    const firstHash = generateMd5(firstHashString);
    const secondHashString = `${data.paydate}${process.env.merchantID}${firstHash}${data.appcode}${process.env.secretKey}`
    const secondHash = generateMd5(secondHashString);
    return secondHash === data.skey;
}

// Ensure required fields are present in a payload.
function checkRequiredFields(data, requiredFields) {
    for (const field of requiredFields) {
        if (!data[field] && isNaN(data[field])) {
            return { valid: false, missingField: field };
        }
    }
    return { valid: true };
}

// Generate a 6-digit OTP.
function generateOTP() {
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
}

// Sign a JWT for the given payload.
function generateJWT(payload) {
    if (!process.env.JWT_SECRET) {
        logger.error('JWT_SECRET environment variable is not set');
        throw new Error('JWT_SECRET environment variable is required but not set');
    }
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    return token;
}

// Verify a JWT and return decoded payload or error.
function verifyJWT(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return { valid: true, decoded };
    } catch (err) {
        logger.error('JWT verification failed:', err);
        return { valid: false, error: err };
    }
}


function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
    });
}

function normalizeDate(date) {
    return new Date(date).toISOString().split('T')[0];
}

function localizedDateTime(date) {
    return (new Date(date +'z')).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" });
}

// Basic email format check
function isValidEmail(email) {
    const emailRegex = /^[A-Za-z0-9._-]+@[A-Za-z]+\.[A-Za-z]{2,3}(?:\.[A-Za-z]{2,3})?$/;
    return emailRegex.test(email);
}

module.exports = {
    generateMd5,
    generateOTP,
    generateJWT,
    verifyJWT,
    validateSkey,
    checkRequiredFields,
    formatDate,
    normalizeDate,
    isValidEmail,
    localizedDateTime
};
