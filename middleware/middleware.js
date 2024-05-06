module.exports = {
    attachUser: function(req, res, next) {
        res.locals.username = req.session.username || 'Guest';
        next();
    },
    ensureAuthenticated: function(req, res, next) {
        if (!req.session.username) {
            return res.redirect('/auth/login');
        }
        next();
    },
    errorHandler: function(err, req, res, next) {
        console.error(err);
        if (res.headersSent) {
            return res.end();
        }
        res.status(500).send('Internal Server Error');
    }
};
