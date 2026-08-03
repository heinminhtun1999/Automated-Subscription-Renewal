function isAuthenticated(req, res, next) {
    if (req.originalUrl === '/admin/login') {
        return next();
    }

    if (!req.session?.isAdmin) {
        req.session.redirectURL = req.originalUrl;
        return res.redirect('/admin/login');
    }
    return next();
}

module.exports = isAuthenticated;