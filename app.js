//---------------------------------------------------------------------------------------------------------------------
/*eslint-disable no-console */
var express	= require('express');
var session = require('express-session');
var expressValidator = require('express-validator');
var bodyParser = require('body-parser');
var passport = require('passport')
  , GoogleStrategy = require('passport-google-oauth2').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , NaverStrategy = require('passport-naver').Strategy
  , KakaoStrategy = require('passport-kakao').Strategy
   , LocalStrategy = require('passport-local').Strategy;

var mysql = require('./database/mysql');
//---------------------------------------------------------------------------------------------------------------------

var app = express();

// deprecate
//app.use(app.router);

app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Methods: GET, POST, PUT');
	res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Access-Control-Allow-Credentials', 'true');
	next();
});
app.use(bodyParser.urlencoded({extended: false}));

app.use(session({secret: 'ckdtnstlzmflt'}));
app.use(expressValidator());


app.use(passport.initialize());
app.use(passport.session());


//---------------------------------------------------------------------------------------------------------------------
var localAuth = require('./auth/local');
passport.use(new LocalStrategy({
//        usernameField : 'username',
//        passwordField : 'password',
        passReqToCallback : true
}, localAuth.login));

app.post('/auth/local', passport.authenticate('local'), function(req, res) {
	res.send({result: true, user: req.user});
});

/*
app.get('/auth/local', passport.authenticate('local',  { successRedirect: '/login_success',
                                      failureRedirect: '/login_fail' }));
*/
app.get('/login_success', ensureAuthenticated, function(req, res){
	res.send({result: true, user: req.user});

   // res.render('users', { user: req.user });
});

function ensureAuthenticated(req, res, next) {
    // 로그인이 되어 있으면, 다음 파이프라인으로 진행
    if (req.isAuthenticated()) { return next(); }
    // 로그인이 안되어 있으면, login 페이지로 진행
	res.send({result: false, auth:false});
}



//---------------------------------------------------------------------------------------------------------------------
var googleAuth = require('./auth/google');
var googleConfig = require('./config/google');
passport.use(new GoogleStrategy(googleConfig, googleAuth.login));

app.get('/auth/google', passport.authenticate('google', { scope: 
    [ 'https://www.googleapis.com/auth/plus.login'
    , 'https://www.googleapis.com/auth/userinfo.profile'
    , 'https://www.googleapis.com/auth/plus.profile.emails.read' ] }));
/*
app.get('/auth/google/callback',
  passport.authenticate('google', { successRedirect: '/login_success',
                                      failureRedirect: '/login_fail' }));
*/
app.get('/auth/google/callback', passport.authenticate('google'), function(req, res) {
//	res.send({result: true, user: req.user});
	res.redirect("http://localhost:3000");
});



//---------------------------------------------------------------------------------------------------------------------
var kakaoConfig = require('./config/kakao');
passport.use(new KakaoStrategy(kakaoConfig,
  function(accessToken, refreshToken, profile, done){
	console.log("accessToken : ", accessToken);
	console.log("refreshToken: ", refreshToken);
    console.log(profile);
    done(null,profile);
  }
));


app.get('/auth/kakao', passport.authenticate('kakao'));
app.get('/auth/kakao/callback',
  passport.authenticate('kakao', { successRedirect: '/login_success',
                                      failureRedirect: '/login_fail' }));



//---------------------------------------------------------------------------------------------------------------------
var naverConfig = require('./config/naver');
passport.use(new NaverStrategy(naverConfig,
  function(accessToken, refreshToken, profile, done) {
    /*User.findOrCreate(..., function(err, user) {
      if (err) { return done(err); }
      done(null, user);
    });
*/
		console.log("accessToken : ", accessToken);
		console.log("refreshToken: ", refreshToken);
        console.log(profile);
        done(null,profile);
  }
));


app.get('/auth/naver', passport.authenticate('naver'));
app.get('/auth/naver/callback',
  passport.authenticate('naver', { successRedirect: '/login_success',
                                      failureRedirect: '/login_fail' }));



//---------------------------------------------------------------------------------------------------------------------
// http://nodeqa.com/nodejs_ref/83
// http://bcho.tistory.com/938
var facebookAuth = require('./auth/facebook');
var facebookConfig = require('./config/facebook');
passport.use(new FacebookStrategy(facebookConfig,
facebookAuth.login
));

// serialize
// 인증후 사용자 정보를 세션에 저장
passport.serializeUser(function(user, done) {
    console.log('serialize');
    // 여기서 user_no만 세션에 넣는다
    done(null, user);
});
 
 
// deserialize
// 인증후, 사용자 정보를 세션에서 읽어서 request.user에 저장
passport.deserializeUser(function(user, done) {
    //findById(id, function (err, user) {
    console.log('deserialize');
    // user_no를 이용해서 db에서 user 데이터를 갖고 온다.
    done(null, user);
    //});
});


app.get('/auth/facebook', passport.authenticate('facebook'));

/*
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/login_success',
                                      failureRedirect: '/login_fail' }));
*/

app.get('/auth/facebook/callback', passport.authenticate('facebook'), function(req, res) {
//	res.send({result: true, user: req.user});
	res.redirect("http://localhost:3000");
});



//---------------------------------------------------------------------------------------------------------------------
/*
app.post('/login', function(req, res) {
	var id = req.param('id');
	var pw = req.param('pw');

	mysql.pool.getConnection(function (err, conn) {
		if (err) {console.error('err : ' + err);}

		conn.query('select user_no from user where user_name = ? and password = ?',[id, pw], function(err, rows) {
			if (err) console.error('err : ' + err);
			console.log('rows : ' + JSON.stringify(rows));

			conn.release();z


			if (rows.length === 0) {
				res.send({result:false, message:'아이디와 비밀번호를 다시 확인해주세요.'});
				return;
			}

			req.user.user_no = rows[0].user_no;
			res.send({result: true, user_no: rows[0].user_no});
		});
	});
});
*/


//---------------------------------------------------------------------------------------------------------------------
app.get('/logout', function(req, res) {
	req.logout();
	res.send({result:true});
});



//---------------------------------------------------------------------------------------------------------------------
var userController = require('./controllers/user');
app.post('/join', userController.join);
app.get('/info/:user_no', userController.userInfo);



//---------------------------------------------------------------------------------------------------------------------
var goodController = require('./controllers/good');
app.get('/good/:article_no', ensureAuthenticated, goodController.good);



//---------------------------------------------------------------------------------------------------------------------
var commentController = require('./controllers/comment');
app.get('/comment/:article_no', commentController.get);
app.post('/comment/:article_no', ensureAuthenticated, commentController.write);



//---------------------------------------------------------------------------------------------------------------------
var articleController = require('./controllers/article');
app.post('/write', ensureAuthenticated, articleController.write);
app.get('/timeline/:myid', articleController.timeline);
app.get('/new', articleController.newArticle);
app.get('/user/:user_no', articleController.userArticle);


//---------------------------------------------------------------------------------------------------------------------
var followController = require('./controllers/follow');

app.get('/follow/:leader_no', ensureAuthenticated, followController.follow);
app.get('/follower/:user_no', followController.followerInfo);
app.get('/following/:user_no', followController.followingInfo);

//---------------------------------------------------------------------------------------------------------------------
var server = app.listen(5000, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);
});

