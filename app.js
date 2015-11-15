var express	= require('express');
var session = require('express-session');
var mysql	= require('mysql');
var expressValidator = require('express-validator');
var bodyParser = require('body-parser');
//---------------------------------------------------------------------------------------------------------------------
/*eslint-disable no-console */


var app = express();
var pool = mysql.createPool({
	connectionLimit: 3,
	host: 'jw0ch9vofhcajqg7.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
	database: 'u9vx1bpj09dlbw13',
	user: 'qex9jk0xto6c6tjg',
	password: 'dmzyqnnuqzdrumwl'
});
//---------------------------------------------------------------------------------------------------------------------

// deprecate
//app.use(app.router);


app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Access-Control-Allow-Credentials', 'true');
	next();
});
app.use(bodyParser.urlencoded({extended: false}));

app.use(session({secret: 'ckdtnstlzmflt'}));
app.use(expressValidator());



//---------------------------------------------------------------------------------------------------------------------
app.get('/info/:user_no', function(req,res) {
	var user_no = req.params.user_no;

	pool.getConnection(function (err, conn) {
		if (err) {console.error('err : ' + err);}

		conn.query('select user_no, user_name,'+
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

});



//---------------------------------------------------------------------------------------------------------------------
app.post('/login', function(req, res) {
	var id = req.param('id');
	var pw = req.param('pw');

	pool.getConnection(function (err, conn) {
		if (err) {console.error('err : ' + err);}

		conn.query('select user_no from user where user_name = ? and password = ?',[id, pw], function(err, rows) {
			if (err) console.error('err : ' + err);
			console.log('rows : ' + JSON.stringify(rows));

			conn.release();


			if (rows.length === 0) {
				res.send({result:false, message:'아이디와 비밀번호를 다시 확인해주세요.'});
				return;
			}

			req.session.user_no = rows[0].user_no;
			res.send({result: true, user_no: rows[0].user_no});
		});
	});
});



//---------------------------------------------------------------------------------------------------------------------
app.get('/logout', function(req, res) {
	req.session.user_no = null;
	res.send({result:true});
});



//---------------------------------------------------------------------------------------------------------------------
app.post('/join', function(req, res) {
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

	pool.getConnection(function (err, conn) {
		if (err) console.error('err : ' + err);

		conn.query('select user_no from user where user_name = ?', id, function(err, rows) {
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

				conn.query('INSERT INTO user (user_name, password, mail) VALUES (?,?,?)',[id, pw, mail], function(err) {
					if (err) console.error('err : ' + err);
					conn.release();

					res.send({result:true});
				});
			});
		});
	});
});



//---------------------------------------------------------------------------------------------------------------------
app.get('/new', function(req,res) {
	var user_no = req.session.user_no;

	console.log("user_no", user_no);
	pool.getConnection(function (err, conn) {
		if (err) console.error('err : ' + err);

		if (user_no) {
			conn.query('select article_no, content, article.user_no, (select count(1) from follow where leader_user_no=user.user_no and lover_user_no=?) as follow_already, (select count(1) from good where good_article_no = article_no and good_user_no = ?) as good_already, (select count(1) from good where good_article_no=article_no) as good_count, user_name as author from article, user where article.user_no = user.user_no ORDER BY article_no DESC', [user_no, user_no], function(err, rows) {
				if (err) console.error('err : ' + err);
				console.log('rows : ' + JSON.stringify(rows));

				conn.release();

				res.send(rows);
			});
		} else {
			conn.query('select article_no, content, article.user_no, (select count(1) from good where good_article_no=article_no) as good_count, user_name as author from article, user where article.user_no = user.user_no ORDER BY article_no DESC', function(err, rows) {
				if (err) console.error('err : ' + err);
				console.log('rows : ' + JSON.stringify(rows));

				conn.release();

				res.send(rows);
			});
		}
	});
});



//---------------------------------------------------------------------------------------------------------------------
app.get('/good/:article_no', function(req,res) {
	var user_no = req.session.user_no;
	var article_no = req.params.article_no;

	if (!user_no || !article_no) {
		res.send({result:false});
		return;
	}
	console.log(user_no, " / ",article_no);

	pool.getConnection(function (err, conn) {
		if (err) console.error('err : ' + err);

		conn.query('select * from good where good_article_no = ? and good_user_no = ?',[article_no, user_no], function(err, rows) {
			if (err) console.error('err : ' + err);

			console.log("length", rows.length);
			if (rows.length > 0) {
				conn.query('delete from good where good_article_no = ? and good_user_no = ?',[article_no, user_no], function(err) {
					conn.release();
					res.send({result:true, article:article_no, good: false})
				});
				return;
			}

			conn.query('INSERT INTO good (good_article_no, good_user_no) VALUES (?,?)',[article_no, user_no], function(err) {
				if (err) console.error('err : ' + err);
				conn.release();
				res.send({result:true, article:article_no, good: true})
			});
		});
	});
});



//---------------------------------------------------------------------------------------------------------------------
app.get('/comment/:article_no', function(req, res) {
	var article_no = req.params.article_no;

	pool.getConnection(function (err, conn) {
		if (err) console.error('err : ' + err);

		conn.query('select comment_no, comment, user_name from comment, user where article_no = ?', article_no, function(err, rows) {
			if (err) console.error('err : ' + err);
			console.log('rows : ' + JSON.stringify(rows));

			conn.release();

			res.send(rows);
		});

	});
});



//---------------------------------------------------------------------------------------------------------------------
app.post('/comment/:article_no', function(req,res) {
	var user_no = req.session.user_no;
	var article_no = req.params.article_no;
	var comment = req.param('comment');

	pool.getConnection(function (err, conn) {
		if (err) console.error('err : ' + err);

		conn.query('INSERT INTO comment (article_no, comment, user_no) VALUES (?,?,?)', [article_no, comment, user_no], function(err) {
			if (err) console.error('err : ' + err);

			conn.release();

			res.send({result:true});
		});

	});

});



//---------------------------------------------------------------------------------------------------------------------
app.post('/write', function(req,res) {
	var user_no = req.session.user_no;
	var content = req.param('content');

	pool.getConnection(function (err, connection) {
		if (err) console.error('err : ' + err);

		// Use the connection
		connection.query('INSERT INTO article (content, user_no) VALUES (?,?)', [content, user_no],function (err) {
			if (err) console.error('err : ' + err);

	//			res.render('index', {title: 'test', rows: rows});
			connection.release();

			res.send({result:true});

			// Don't use the connection here, it has been returned to the pool.
		});
	});

});

//---------------------------------------------------------------------------------------------------------------------
app.post('/timeline', function(req, res) {
	var myid = req.param('myid');

	console.log(myid);

	pool.getConnection(function (err, connection) {
		if (err) console.error('err : ' + err);

		// Use the connection
		connection.query('SELECT *,(SELECT COUNT(1) FROM good WHERE good_article_no=article_no) as good,(select count(1) from follow where lover_user_no=? and leader_user_no=user_no) as follow from article', 'curtis',function (err, rows) {
			if (err) console.error('err : ' + err);
			console.log('rows : ' + JSON.stringify(rows));

	//			res.render('index', {title: 'test', rows: rows});
			connection.release();

			res.send(rows);

			// Don't use the connection here, it has been returned to the pool.
		});
	});

});



//---------------------------------------------------------------------------------------------------------------------
app.get('/following/:user_no', function(req,res) {
	var user_no = req.params.user_no;

	pool.getConnection(function (err, conn) {
		if (err) console.error('err : ' + err);

		conn.query('select user_no, user_name from user, follow where user.user_no = follow.leader_user_no and follow.lover_user_no=?', user_no, function(err,rows) {
			if (err) console.error('err : ' + err);

			conn.release();

			res.send(rows);
		});
	});
});



//---------------------------------------------------------------------------------------------------------------------
app.get('/follower/:user_no', function(req,res) {
	var user_no = req.params.user_no;

	pool.getConnection(function (err, conn) {
		if (err) console.error('err : ' + err);

		conn.query('select user_no, user_name from user, follow where user.user_no = follow.lover_user_no and follow.leader_user_no=?', user_no, function(err,rows) {
			if (err) console.error('err : ' + err);

			conn.release();

			res.send(rows);
		});
	});
});



//---------------------------------------------------------------------------------------------------------------------
app.get('/follow/:leader_no', function(req, res) {
	var leader_no = req.params.leader_no;
	var user_no = req.session.user_no;

	if (!user_no) {
		res.send({result: false});
		return;
	}

	pool.getConnection(function (err, connection) {
		if (err) console.error('err : ' + err);

		// Use the connection
		connection.query('SELECT * FROM follow WHERE leader_user_no = ? and lover_user_no = ?', [leader_no, user_no] ,function (err, rows) {
			if (err) console.error('err : ' + err);

			if (rows.length > 0) {
				connection.query('DELETE FROM follow WHERE leader_user_no = ? and lover_user_no = ?', [leader_no, user_no] ,function (err) {
					if (err) console.error('err : ' + err);
					connection.release();
					res.send({result:true, leader_no:leader_no, follow:false});

				});
				return;
			}

			connection.query('INSERT INTO follow (leader_user_no, lover_user_no) VALUES (?,?)', [leader_no, user_no], function(err) {
				if (err) console.error('err : ' + err);
				connection.release();
				res.send({result:true, leader_no:leader_no, follow:true});
			});
		});
	});

});
//---------------------------------------------------------------------------------------------------------------------
var server = app.listen(8088, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);
});

