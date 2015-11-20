var async = require('async');
var mysql = require('../database/mysql');

var articleController = {};

// 새로운 글을 등록한다.
articleController.write =  function(req,res) {
	var user_no = req.user.user_no;
	var content = req.param('content');

	mysql.pool.getConnection(function (err, connection) {
		if (err) console.error('err : ' + err);

		connection.query('INSERT INTO article (content, user_no) VALUES (?,?)', [content, user_no],function (err) {
			if (err) console.error('err : ' + err);

			connection.release();

			res.send({result:true});
		});
	});

};

articleController.timeline = function(req, res) {
	var myid = req.param('myid');

	console.log(myid);

	mysql.pool.getConnection(function (err, connection) {
		if (err) console.error('err : ' + err);

		// Use the connection
		connection.query('SELECT *,(SELECT COUNT(1) FROM good WHERE good_article_no=article_no) as good,(select count(1) from follow where lover_user_no=? and leader_user_no=user_no) as follow from article', 'curtis',function (err, rows) {
			if (err) console.error('err : ' + err);
			console.log('rows : ' + JSON.stringify(rows));

		    var pending = rows.length;

			async.each(rows, function(row, callback) {
		        conn.query('SELECT comment_no, comment.comment, user.user_no, user.display_name FROM comment,user WHERE comment.user_no = user.user_no AND article_no = ?',  row.article_no , function(err, comment){
		        	row.comment_list = comment;
		        	callback();
		        });
			}, function (err) {
						conn.release();
						res.send(rows);
			});
		});
	});

};

articleController.newArticle = function(req,res) {
	var user = req.user;
	var last_no = req.param('last_no');


	mysql.pool.getConnection(function (err, conn) {
		if (err) console.error('err : ' + err);

		var query = {};
		var query_param = [];
		var article_num = 3;


		if (user && user.user_no) {
			if (last_no > 0) {
				query = 'select article_no, content, article.user_no, (select count(1) from follow where leader_user_no=user.user_no and lover_user_no=?) as follow_already, (select count(1) from good where good_article_no = article_no and good_user_no = ?) as good_already, (select count(1) from good where good_article_no=article_no) as good_count, user_name as author from article, user where article.user_no = user.user_no AND article_no < ? ORDER BY article_no DESC limit ?';
				query_param = [user.user_no, user.user_no, last_no, article_num];
			} else {
				query = 'select article_no, content, article.user_no, (select count(1) from follow where leader_user_no=user.user_no and lover_user_no=?) as follow_already, (select count(1) from good where good_article_no = article_no and good_user_no = ?) as good_already, (select count(1) from good where good_article_no=article_no) as good_count, user_name as author from article, user where article.user_no = user.user_no ORDER BY article_no DESC limit ?';
				query_param = [user.user_no, user.user_no, article_num];
			}

			conn.query(query, query_param, function(err, rows) {
				if (err) console.error('err : ' + err);
				console.log('rows : ' + JSON.stringify(rows));

				async.each(rows, function(row, callback) {
			        conn.query('SELECT comment_no, comment.comment, user.user_no, user.display_name FROM comment,user WHERE comment.user_no = user.user_no AND article_no = ?',  row.article_no , function(err, comment){
			        	row.comment_list = comment;
			        	callback();
			        });
				}, function (err) {
							conn.release();
							res.send(rows);
				});

			});
		} else {
			if (last_no > 0) {
				query = 'select article_no, content, article.user_no, (select count(1) from good where good_article_no=article_no) as good_count, user_name as author from article, user where article.user_no = user.user_no AND article_no < ? ORDER BY article_no DESC limit ?';
				query_param = [last_no, article_num];
			} else {
				query = 'select article_no, content, article.user_no, (select count(1) from good where good_article_no=article_no) as good_count, user_name as author from article, user where article.user_no = user.user_no ORDER BY article_no DESC limit ?';
				query_param = article_num;
			}

			conn.query(query, query_param, function(err, rows) {
				if (err) console.error('err : ' + err);

				async.each(rows, function(row, callback) {
			        conn.query('SELECT comment_no, comment.comment, user.user_no, user.display_name FROM comment,user WHERE comment.user_no = user.user_no AND article_no = ?',  row.article_no , function(err, comment){
			        	row.comment_list = comment;
			        	callback();
			        });
				}, function (err) {
							conn.release();
							res.send(rows);
				});

			});
		}
	});
};

articleController.userArticle = function(req, res) {
	var user = req.user;
	var user_no = req.param('user_no'); // 글을 보고자 하는 유저

	mysql.pool.getConnection(function (err, conn) {
		if (err) console.error('err : ' + err);

		if (user && user.user_no) {
			conn.query('select article_no, content, article.user_no, (select count(1) from follow where leader_user_no=user.user_no and lover_user_no=?) as follow_already, (select count(1) from good where good_article_no = article_no and good_user_no = ?) as good_already, (select count(1) from good where good_article_no=article_no) as good_count, user_name as author from article, user where article.user_no = ? ORDER BY article_no DESC', [user.user_no, user.user_no, user_no], function(err, rows) {
				if (err) console.error('err : ' + err);
				console.log('rows : ' + JSON.stringify(rows));

				async.each(rows, function(row, callback) {
			        conn.query('SELECT comment_no, comment.comment, user.user_no, user.display_name FROM comment,user WHERE comment.user_no = user.user_no AND article_no = ?',  row.article_no , function(err, comment){
			        	row.comment_list = comment;
			        	callback();
			        });
				}, function (err) {
							conn.release();
							res.send(rows);
				});

			});
		} else {
			conn.query('select article_no, content, article.user_no, (select count(1) from good where good_article_no=article_no) as good_count, user_name as author from article, user where article.user_no = ? ORDER BY article_no DESC', user_no, function(err, rows) {
				if (err) console.error('err : ' + err);

				async.each(rows, function(row, callback) {
			        conn.query('SELECT comment_no, comment.comment, user.user_no, user.display_name FROM comment,user WHERE comment.user_no = user.user_no AND article_no = ?',  row.article_no , function(err, comment){
			        	row.comment_list = comment;
			        	callback();
			        });
				}, function (err) {
							conn.release();
							res.send(rows);
				});

			});
		}
	});
}

module.exports = articleController;