const bcrypt = require('bcrypt');

function renderLoginPage(req, res) {
    return res.render('admin/login', {
        redirectURL: req.session.redirectURL || '/admin',
        error: req.session.authError || null
    });
}

function handleAuth(req, res) {
    const { password, redirect_url } = req.body;
    const target = (typeof redirect_url === 'string' && redirect_url.startsWith('/')) ? redirect_url : (req.session?.redirectURL || '/admin');
    if (!password) {
        req.session.authError = "Password is required.";
        return res.redirect('/admin/login');
    }
    
    bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH, (err, result) => {
        if (err || !result) {
            req.session.authError = err ? JSON.stringify(err) : 'Incorrect Password';
            return res.redirect('/admin/login');
        }
        // regenerate session to avoid fixation
        req.session.regenerate((regenErr) => {
            if (regenErr) {
                req.session.authError = 'Unable to start session';
                return res.redirect('/admin/login');
            }
            req.session.isAdmin = true;
            // clear stored redirect/error
            delete req.session.redirectURL;
            delete req.session.authError;
            
            return res.redirect(target);
        });

    });
}

module.exports = {
    renderLoginPage,
    handleAuth
}