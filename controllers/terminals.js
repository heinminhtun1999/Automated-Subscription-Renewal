const terminalsController = (req, res) => {
    return res.render('terminals', { query: req.query });   
}

module.exports = terminalsController;