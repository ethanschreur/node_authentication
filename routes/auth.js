const Router = require('express').Router;
const ExpressError = require('../expressError');

const User = require('../models/user');

const jwt = require('jsonwebtoken');

const router = new Router();
const { SECRET_KEY } = require('../config');

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async function(req, res, next) {
	try {
		const username = req.body.username;
		const password = req.body.password;
		const auth = await User.authenticate(username, password);
		if (auth) {
			User.updateLoginTimestamp(username);
			return res.json({ token: jwt.sign({ username }, SECRET_KEY) });
		} else {
			throw new ExpressError('authentication failed', 400);
		}
	} catch (err) {
		return next(err);
	}
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async function(req, res, next) {
	try {
		const user = await User.register(req.body);
		const username = user.username;
		User.updateLoginTimestamp(username);
		return res.json({ token: jwt.sign({ username }, SECRET_KEY) });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
