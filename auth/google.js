var mysql = require('../database/mysql');

var googleAuth = {};

googleAuth.login = function(request, accessToken, refreshToken, profile, done) {
	mysql.pool.getConnection(function (err, conn) {
		if (err) {console.error('err : ' + err);}

		conn.query('select user_no, display_name from user where provider = ? and id = ? limit 1',[profile.provider, profile.id], function(err, rows) {
			if (err) console.error('err : ' + err);
			console.log('rows : ' + JSON.stringify(rows));

			if (rows.length === 0) {
				conn.query('insert into user (provider, id, display_name, mail, photo) values (?,?,?,?,?)',[profile.provider, profile.id, profile.displayName, profile.email, profile.photos[0].value], function(err) {
					if (err) console.error('err : ' + err);
					console.log('rows : ' + JSON.stringify(rows));

					conn.query('select user_no, display_name from user where provider = ? and id = ? limit 1',[profile.provider, profile.id], function(err, rows) {
						if (err) console.error('err : ' + err);
						console.log('rows : ' + JSON.stringify(rows));

						conn.release();
//						var user = {"user_no": rows[0].user_no};
						return done(null, rows[0]);
					});
				});
				return;
			}

			if (rows[0].displayName != profile.displayName || rows[0].mail != profile.email || rows[0].photo != profile.photos[0].value) {
				conn.query('update user set display_name = ?, mail = ?, photo = ? where provider = ? and id = ?', [profile.displayName, profile.email, profile.photos[0].value, profile.provider, profile.id], function(err) {
					if (err) console.error('err : ' + err);
					console.log('rows : ' + JSON.stringify(rows));

					conn.release();
//					var user = {"user_no": rows[0].user_no};
					return done(null, rows[0]);
				});
				return;
			}

			conn.release();

//			var user = {"user_no": rows[0].user_no};
			return done(null, rows[0]);
		});
	});  	

  	/*
  	console.log("request : ", request);
  	console.log("accessToken : ",accessToken);
    done(null,profile);
    */
  };

module.exports = googleAuth;