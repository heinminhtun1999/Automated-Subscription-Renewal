async function paymentController(req, res, next) {

    if (!req.session) {
        const err = new Error('Session not found. Please refresh the page and try again.');
        err.status = 400;
        return next(err);
    }

    const isVerified = req.session.isVerified;
    if (!isVerified) {
        const err = new Error('Unauthorized. Please verify your identity before making a payment.');
        err.status = 401;
        return next(err);
    }

    const companyData = req.session.data;
    if (!companyData) {
        const err = new Error('Request data not found. Please refresh the page and try again.\n If the issue persists, contact support.');
        err.status = 400;
        return next(err);
    }



    const data = req.body;
}

module.exports = paymentController;