var mysql = require('../database/mysql');
var crypto = require('crypto');

var userController = {};

userController.join = function(req, res) {
	req.assert('id', '아이디는 필수입니다.').notEmpty();
	req.assert('id', '아이디는 3~30글자 사이로 입력해주세요.').len(3, 30);

	req.assert('pw', '비밀번호는 필수입니다. ').notEmpty();
	req.assert('pw', '비밀번호는 4글자 이상 입력해주세요.').len(4,255);

	req.assert('mail', 'A valid email is required').isEmail();
//  req.checkBody('leader_email', 'Enter a valid email address.').isEmail();

	var errors = req.validationErrors();  
	if (errors) {
		res.send(JSON.stringify(errors));
		console.log(JSON.stringify(errors));
		return;
	}

	var id = req.param('id');
	var pw = req.param('pw');
	var mail = req.param('mail');

	mysql.pool.getConnection(function (err, conn) {
		if (err) console.error('err : ' + err);

		conn.query('select user_no from user where id = ?', id, function(err, rows) {
			if (err) console.error('err : ' + err);
			console.log('rows : ' + JSON.stringify(rows));

			if (rows.length > 0) {
				conn.release();

				res.send({result:false,message:'중복되는 아이디가 있습니다.'});
				return;
			}

			conn.query('select user_no from user where mail = ?', mail, function(err, rows) {
				if (err) console.error('err : ' + err);
				console.log('rows : ' + JSON.stringify(rows));

				if (rows.length > 0) {
					conn.release();

					res.send({result:false,message:'중복되는 이메일이 있습니다.'});
					return;
				}
				
				var shasum = crypto.createHash('sha1');
				shasum.update(pw);
				var pw_enc = shasum.digest('hex');

				conn.query('INSERT INTO user (id, display_name, password, mail) VALUES (?,?,?,?)',[id, id, pw_enc, mail], function(err) {
					if (err) console.error('err : ' + err);
					conn.release();

					res.send({result:true});
				});
			});
		});
	});
};

userController.userInfo = function(req,res) {
	var user_no = req.params.user_no;

	mysql.pool.getConnection(function (err, conn) {
		if (err) {console.error('err : ' + err);}

		conn.query('select user_no, display_name,'+
			' (select count(1) from article where user_no=user.user_no) as article_count,'+
			' (select count(1) from comment where user_no=user.user_no) as comment_count,'+
			' (select count(1) from follow where lover_user_no=user_no) as following_count,'+
			' (select count(1) from follow where leader_user_no=user_no) as follower_count'+
		 ' from user where user_no = ? limit 1',user_no, function(err, rows) {
			if (err) console.error('err : ' + err);
			console.log('rows : ' + JSON.stringify(rows));

			conn.release();
			res.send(rows[0]);
		});
	});
};


module.exports = userController;