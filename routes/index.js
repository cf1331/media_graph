
/**
 * Application main page.
 *
 */
exports.index = function (req, res) {
    term = req.param('term')
	res.render('index', { title: term });
};
