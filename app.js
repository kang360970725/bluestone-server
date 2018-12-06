var express = require('express');
var path = require('path');
// var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
// var fs = require('fs');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var upload = require('./routes/upload');
var bitmex = require('./routes/bitmex');
var send = require('./routes/send');


var app = express();


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

var allowCrossDomain = function (req, res, next) {
    // res.header('Access-Control-Allow-Origin', 'http://localhost'); //必须重新设置，把origin的域加上去
    res.header('Access-Control-Allow-Origin', '*'); //必须重新设置，把origin的域加上去
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'x-custom');
    res.header('Access-Control-Allow-Headers', 'content-type,Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');//和客户端对应，必须设置以后，才能接收cookie.
    next();
};
app.use(allowCrossDomain);//运用跨域的中间件
// app.use(cookieParser());//运用cookie解析的中间件
app.use(session({
    resave:false,//添加这行
    saveUninitialized: true,
    secret: 'abc123456', //secret的值建议使用随机字符串
    cookie: {maxAge: 60 * 1000 * 30} // 过期时间（毫秒）
}));

app.use(express.static(__dirname+'/public'));

app.get('/public/images/*', function (req, res) {
    res.sendFile( __dirname + "/" + req.url );
    console.log("Request for " + req.url + " received.");
})

app.use('/', indexRouter,usersRouter,upload,bitmex,send);
// app.use('/users', usersRouter);
module.exports = app;
