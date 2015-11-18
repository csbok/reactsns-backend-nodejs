var mysql = require('../database/mysql');

var facebookAuth = {};
facebookAuth.login = function(accessToken, refreshToken, profile, done) {
	mysql.pool.getConnection(function (err, conn) {
		if (err) {console.error('err : ' + err);}

		conn.query('select user_no, display_name from user where provider = ? and id = ? limit 1',[profile.provider, profile.id], function(err, rows) {
			if (err) console.error('err : ' + err);
			console.log('rows : ' + JSON.stringify(rows));

			if (rows.length === 0) {
				conn.query('insert into user (provider, id, display_name) values (?,?,?)',[profile.provider, profile.id, profile.displayName], function(err) {
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

			if (rows[0].displayName != profile.displayName) {
				conn.query('update user set display_name = ? where provider = ? and id = ?', [profile.displayName, profile.provider, profile.id], function(err) {
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
    /*User.findOrCreate(..., function(err, user) {
      if (err) { return done(err); }
      done(null, user);
    });
		console.log("accessToken : ", accessToken);
		console.log("refreshToken: ", refreshToken);
        console.log(profile);
        done(null,profile);
*/

  };


module.exports = facebookAuth;