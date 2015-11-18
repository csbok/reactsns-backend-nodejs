var mysql = require('../database/mysql');

var commentController = {};

commentController.get = function(req, res) {
	var article_no = req.params.article_no;

	mysql.pool.getConnection(function (err, conn) {
		if (err) console.error('err : ' + err);

		conn.query('select comment_no, comment, user_name from comment, user where article_no = ?', article_no, function(err, rows) {
			if (err) console.error('err : ' + err);
			console.log('rows : ' + JSON.stringify(rows));

			conn.release();

			res.send(rows);
		});

	});
};

commentController.write = function(req,res) {
	var user_no = req.user.user_no;
	var article_no = req.params.article_no;
	var comment = req.param('comment');

	mysql.pool.getConnection(function (err, conn) {
		if (err) console.error('err : ' + err);

		conn.query('INSERT INTO comment (article_no, comment, user_no) VALUES (?,?,?)', [article_no, comment, user_no], function(err) {
			if (err) console.error('err : ' + err);

			conn.release();

			res.send({result:true});
		});

	});
};

module.exports = commentController;