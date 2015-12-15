var mysql = require('../database/mysql');

var followController = {};

// leader_no에게 follow 요청
followController.follow = function(req, res) {
	var leader_no = req.params.leader_no;
	var user_no = req.user.user_no;

	mysql.pool.getConnection(function (err, connection) {
		if (err) console.error('err : ' + err);

		// 이미 follow 관계가 맺어 있는지 확인한다.
		connection.query('SELECT * FROM follow WHERE leader_user_no = ? and lover_user_no = ?', [leader_no, user_no] ,function (err, rows) {
			if (err) console.error('err : ' + err);

			// 관계가 맺어있을 경우 해제한다.
			if (rows.length > 0) {
				connection.query('DELETE FROM follow WHERE leader_user_no = ? and lover_user_no = ?', [leader_no, user_no] ,function (err) {
					if (err) console.error('err : ' + err);
					connection.release();
					res.send({result:true, leader_no:leader_no, follow:false});

				});
				return;
			}

			// 새로운 follow 관계를 맺는다.
			connection.query('INSERT INTO follow (leader_user_no, lover_user_no) VALUES (?,?)', [leader_no, user_no], function(err) {
				if (err) console.error('err : ' + err);
				connection.release();
				res.send({result:true, leader_no:leader_no, follow:true});
			});
		});
	});
};

// 팔로워(나를 따르는 사람)의 목록을 구함
followController.followerInfo = function(req,res) {
	var user_no = req.params.user_no;
	var user = req.user;

	var query = '';
	var query_param = [];
	if (user && user.user_no) {
		query = 'select user_no, display_name, (select count(1) from follow where leader_user_no=user.user_no and lover_user_no=?) as follow_already from user, follow where user.user_no = follow.lover_user_no and follow.leader_user_no=?';
		query_param = [user.user_no,user_no];
	} else {
		query = 'select user_no, display_name from user, follow where user.user_no = follow.lover_user_no and follow.leader_user_no=?';
		query_param = user_no;
	}

	mysql.pool.getConnection(function (err, conn) {
		if (err) console.error('err : ' + err);

		conn.query(query, query_param, function(err,rows) {
			if (err) console.error('err : ' + err);

			conn.release();

			res.send(rows);
		});
	});
};

// 팔로잉(내가 따르는 사람)의 목록을 구함
followController.followingInfo = function(req,res) {
	var user_no = req.params.user_no;
	var user = req.user;

	var query = '';
	var query_param = [];
	if (user && user.user_no) {	
		query = 'select user_no, display_name, (select count(1) from follow where leader_user_no=user.user_no and lover_user_no=?) as follow_already from user, follow where user.user_no = follow.leader_user_no and follow.lover_user_no=?';
		query_param = [user.user_no, user_no];
	} else {
		query = 'select user_no, display_name from user, follow where user.user_no = follow.leader_user_no and follow.lover_user_no=?';
		query_param = user_no;
	}

	mysql.pool.getConnection(function (err, conn) {
		if (err) console.error('err : ' + err);

		conn.query(query, query_param, function(err,rows) {
			if (err) console.error('err : ' + err);

			conn.release();

			res.send(rows);
		});
	});
}

module.exports = followController;