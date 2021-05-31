const Router = require('express').Router;
const router = new Router();

const Message = require('../models/message');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', async function(req, res, next) {
	try {
		const id = req.params.id;
		const message = await Message.get(id);

		const username = req.user.username;

		if (message.from_user.username == username || message.to_user.username === username) {
			return res.json({ message });
		}
	} catch (err) {
		return next(err);
	}
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', async function(req, res, next) {
	try {
		const message = await Message.create(req.user.username, req.body.to_username, req.body.body);
		return { message };
	} catch (err) {
		return next(err);
	}
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', async function(req, res, next) {
	try {
		const message = await Message.markRead(req.params.id);
		return { message };
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
