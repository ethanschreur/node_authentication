/** User class for message.ly */

const { BCRYPT_WORK_FACTOR } = require('../config');
const db = require('../db');
const ExpressError = require('../expressError');
const Message = require('./message');

/** User of the site. */

class User {
	/** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

	static async register({ username, password, first_name, last_name, phone }) {
		const result = await db.query(
			`
      INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
      VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      RETURNING username, password, first_name, last_name, phone
      `,
			[ username, password, first_name, last_name, phone ]
		);
		if (result.rows[0] == false) {
			throw new ExpressError('The user: ' + username + 'could not be created');
		}
		return results.rows[0];
	}

	/** Authenticate: is this username/password valid? Returns boolean. */

	static async authenticate(username, password) {
		const result = await db.query(
			`
    SELECT password FROM users WHERE username = $1
    `,
			[ 'username' ]
		);
		return BCRYPT_WORK_FACTOR.compare(password, result.rows[0].password);
	}

	/** Update last_login_at for user */

	static async updateLoginTimestamp(username) {
		const results = await db.query(
			`
      UPDATE users SET last_login_at = current_timestamp WHERE username = $1
      `,
			[ username ]
		);
		if (results.rows[0] == false) {
			throw new ExpressError('The user: ' + username + "'s timestamp could not be updated");
		}
		return results.rows[0];
	}

	/** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

	static async all() {
		const results = await db.query(
			`
    SELECT username, first_name, last_name, phone FROM 
    users ORDER BY last_name, first_name
      `
		);
		if (results.rows == false) {
			throw new ExpressError('The users could not be returned');
		}
		return results.rows;
	}

	/** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

	static async get(username) {
		const results = await db.query(
			`
    SELECT username, first_name, last_name, phone, join_at, last_login_at FROM
    users WHERE username = $1
    `,
			[ username ]
		);
		if (results.rows[0] == false) {
			throw new ExpressError('The user: ' + username + 'does not exist');
		}
		return results.rows[0];
	}

	/** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

	static async messagesFrom(username) {
		const results = await db.query(
			`
    SELECT m.id, m.body, m.sent_at, m.read_at,
    u.username, u.first_name, u.last_name, u.phone
    FROM messages AS m WHERE m.username = $1
    JOIN users AS u ON m.from_username = u.username 
    `,
			[ username ]
		);
		if (results.rows == false) {
			throw new ExpressError('The user: ' + username + "'s messages they send could not be retrieved");
		}
		return results.map((m) => {
			return { id, to_user: { username, first_name, last_name, phone }, body, semt_at, read_at };
		});
	}

	/** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

	static async messagesTo(username) {
		const results = await db.query(
			`
    SELECT m.id, m.body, m.sent_at, m.read_at
    u.id AS uid, u.first_name, u.last_name, u.phone FROM messages AS m 
    JOIN users AS u ON u.username = m.from_username WHERE m.username = $1
  `,
			[ username ]
		);
		if (results.rows == false) {
			throw new ExpressError('The user: ' + username + "'s messages received could not be retrieved");
		}
		return results.rows.map((m) => {
			return { id, from_user: { id: uid, first_name, last_name, phone }, body, sent_at, read_at };
		});
	}
}

module.exports = User;
