var mysql = require('../database/mysql');

var goodController = {};

goodController.good = function(req,res) {
	var user_no = req.user.user_no;
	var article_no = req.params.article_no;

	if (!article_no) {
		res.send({result:false});
		return;
	}
	console.log(user_no, " / ",article_no);

	mysql.pool.getConnection(function (err, conn) {
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
};

module.exports = goodController;