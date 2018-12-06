var express = require('express');
var router = express.Router();

// 导入MySQL模块
var mysql = require('mysql');
var dbConfig = require('../db_models/DBConfig');
var userSQL = require('../db_models/usersql');

var moment = require('moment');

// 响应一个JSON数据
var responseJSON = function (res, ret) {
    if (typeof ret === 'undefined') {
        res.json({
            status: '-200',
            msg: '操作失败'
        });
    } else {
        res.json(ret);
    }
};
// 使用DBConfig.js的配置信息创建一个MySQL连接池
var pool = mysql.createPool(dbConfig.mysql);
//获取时间
function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate;
    return currentdate.toString();
}
var datatime = 'public/images/'+getNowFormatDate();
//将图片放到服务器
var multer = require('multer')
var storage = multer.diskStorage({
    // 如果你提供的 destination 是一个函数，你需要负责创建文件夹
    destination: datatime,
    //给上传文件重命名，获取添加后缀名
    filename: function (req, file, cb) {
        console.log(req.params.type);
        let name = req.params.account + req.params.type;
        cb(null,  name + '.'+(file.originalname).split('.')[1]);
    }
});
var upload = multer({
    storage: storage
});

router.post('/addPicture/:account/:type',upload.single('picUrl'),function(req,res,next){
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        if(req.params.type == 'pay'){//上传的是购买凭证
            // 建立连接
            connection.query(userSQL.putRenew, [req.file.path, parseInt(req.body.id),req.params.account], function (err, result) {
                if (!!result) {
                    result = {
                        status: 0,
                        msg: '提交成功'
                    };
                    responseJSON(res, result);
                }else {
                    result = {
                        status: 0,
                        msg: '提交成功'
                    };
                    responseJSON(res, result);
                }
                // 释放连接
                connection.release();
            });
        }else {//上传的是转账凭证
            // 建立连接
            connection.query(userSQL.putBonus, [req.file.path, parseInt(req.body.id),req.params.account], function (err, result) {
                if (!!result) {
                    result = {
                        status: 0,
                        msg: '提交成功'
                    };
                    responseJSON(res, result);
                }else {
                    result = {
                        status: 0,
                        msg: '提交成功'
                    };
                    responseJSON(res, result);
                }
                // 释放连接
                connection.release();
            });
        }
    });
});

module.exports = router;