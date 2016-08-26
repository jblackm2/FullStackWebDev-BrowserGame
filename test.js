var express = require('express');
var sqlite = require('sqlite3');

var server = express();
var database = new sqlite.Database('database.sqlite');

database.serialize(function() {
	database.run('PRAGMA foreign_keys = ON;');

	database.run(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
			name TEXT,
			UNIQUE (name)
		);
	`);

	database.run(`
		CREATE TABLE IF NOT EXISTS messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
			user INTEGER REFERENCES users(id) NOT NULL,
			timestamp INTEGER DEFAULT (strftime('%s', 'now')),
			content TEXT
		);
	`);

	database.run('', function(objectError) {
		console.log('created tables');
	});
});

server.get('/new_user', function(req, res) {
	var functionPreprocess = function() {
		if (req.query.user === undefined) {
			req.query.user = '';
		}

		functionInsert();
	};

	var functionInsert = function() {
		database.run(`
			INSERT INTO users (
				name
			) VALUES (
				:user
			);
		`, {
			':user': req.query.user,
		}, function(objectError) {
			if (objectError !== null) {
				functionError(String(objectError));

				return;
			}

			functionSuccess();
		});
	};

	var functionError = function(strError) {
		res.status(200);

		res.set({
			'Content-Type': 'text/plain'
		});

		res.write(strError);

		res.end();
	};

	var functionSuccess = function() {
		res.status(200);

		res.set({
			'Content-Type': 'text/plain'
		});

		res.write('new user inserted');

		res.end();
	};

	functionPreprocess();
});

server.get('/new_message', function(req, res) {
	var functionPreprocess = function() {
		if (req.query.user === undefined) {
			req.query.user = '';
		}

		if (req.query.message === undefined) {
			req.query.message = '';
		}

		functionInsert();
	};

	var functionInsert = function() {
		database.run(`
			INSERT INTO messages (
				user,
				content
			) VALUES (
				( SELECT id FROM users WHERE name = :user ),
				:message
			);
		`, {
			':user': req.query.user,
			':message': req.query.message
		}, function(objectError) {
			if (objectError !== null) {
				functionError(String(objectError));

				return;
			}

			functionSuccess();
		});
	};

	var functionError = function(strError) {
		res.status(200);

		res.set({
			'Content-Type': 'text/plain'
		});

		res.write(strError);

		res.end();
	};

	var functionSuccess = function() {
		res.status(200);

		res.set({
			'Content-Type': 'text/plain'
		});

		res.write('new message inserted');

		res.end();
	};

	functionInsert();
});

server.get('/messages_all', function(req, res) {
	var functionPreprocess = function() {
		req.query.timestamp = parseInt(req.query.timestamp, 10);

		if (isNaN(req.query.timestamp) === true) {
			req.query.timestamp = 0;
		}

		functionSelect();
	};

	var functionSelect = function() {
		database.all(`
			SELECT * FROM messages
			JOIN users ON (messages.user = users.id)
			WHERE messages.timestamp >= :timestamp
			ORDER BY messages.timestamp DESC;
		`, {
			':timestamp': req.query.timestamp
		}, function(objectError, objectRows) {
			if (objectError !== null) {
				functionError(String(objectError));

				return;
			}

			functionSuccess(JSON.stringify(objectRows, null, 4));
		});
	};

	var functionError = function(strError) {
		res.status(200);

		res.set({
			'Content-Type': 'text/plain'
		});

		res.write(strError);

		res.end();
	};

	var functionSuccess = function(strRows) {
		res.status(200);

		res.set({
			'Content-Type': 'text/plain'
		});

		res.write(strRows);

		res.end();
	};

	functionPreprocess();
});

server.get('/messages_user', function(req, res) {
	var functionPreprocess = function() {
		req.query.timestamp = parseInt(req.query.timestamp, 10);

		if (isNaN(req.query.timestamp) === true) {
			req.query.timestamp = 0;
		}

		if (req.query.user === undefined) {
			req.query.user = '';
		}

		functionSelect();
	};

	var functionSelect = function() {
		database.all(`
			SELECT * FROM messages
			JOIN users ON (messages.user = users.id)
			WHERE users.name = :user
			AND messages.timestamp >= :timestamp
			ORDER BY messages.timestamp DESC;
		`, {
			':timestamp': req.query.timestamp,
			':user': req.query.user
		}, function(objectError, objectRows) {
			if (objectError !== null) {
				functionError(String(objectError));

				return;
			}

			functionSuccess(JSON.stringify(objectRows, null, 4));
		});
	};

	var functionError = function(strError) {
		res.status(200);

		res.set({
			'Content-Type': 'text/plain'
		});

		res.write(strError);

		res.end();
	};

	var functionSuccess = function(strRows) {
		res.status(200);

		res.set({
			'Content-Type': 'text/plain'
		});

		res.write(strRows);

		res.end();
	};

	functionPreprocess();
});

server.listen(process.env.PORT || 8080);
