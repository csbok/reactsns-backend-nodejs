var mysql = require('../database/mysql');

var localAuth = {};
localAuth.login = function(req, username, password, done) {
	mysql.pool.getConnection(function (err, conn) {
		if (err) {console.error('err : ' + err);}

		conn.query('select user_no from user where user_name = ? and password = ?',[username, password], function(err, rows) {
			if (err) console.error('err : ' + err);
			console.log('rows : ' + JSON.stringify(rows));

			conn.release();
 
			if (rows.length === 0) {
				return done(null, false);
				return;
			}

			var user = {"display_name":username, "user_no": rows[0].user_no};
			return done(null, user);
		});
	});
};

module.exports = localAuth;