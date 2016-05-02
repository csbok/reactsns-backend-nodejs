var mysql = require('../database/mysql');
var crypto = require('crypto');

var localAuth = {};
localAuth.login = function(req, username, password, done) {
	mysql.pool.getConnection(function (err, conn) {
		if (err) {console.error('err : ' + err);}

		var shasum = crypto.createHash('sha256');
		shasum.update(password);
		var pw_enc = shasum.digest('hex');

		var query = 'select user_no from user where id = ? and password = ?';
		var param = [username, pw_enc];
		// username이 *인 경우는 password로 넘오는 값이 uuid 이다.
		if (username == '*') {
			query = 'select user_no from user where uuid = ?';
			param = [password];
		}
		
		conn.query(query, param, function(err, rows) {
			if (err) console.error('err : ' + err);
			console.log('rows : ' + JSON.stringify(rows));

			conn.release();

			if (rows.length === 0) {
				return done(null, false);
			}
			
			var displayName = username;
			if (rows[0].display_name) {
				displayName = rows[0].display_name;
			}

			var user = {"display_name":display_name, "user_no": rows[0].user_no};
			return done(null, user);
		});
	});
};

module.exports = localAuth;
