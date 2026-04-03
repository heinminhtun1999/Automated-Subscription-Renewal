// Reject requests that do not match allowed origin or referer.
function verifyOrigin(req, res, next) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS;
    
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    
    // Require at least one origin signal to reduce CSRF risk.
    if (!origin && !referer) {
        const err = new Error("Forbidden");
        err.status = 403;
        return next(err);
    }

    if (
        origin !== allowedOrigins &&
        !referer?.startsWith(allowedOrigins)
    ) {
        const err = new Error("CSRF blocked");
        err.status = 403;
        return next(err);
    }

    next();
}

module.exports = verifyOrigin;