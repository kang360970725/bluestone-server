var nodemailer = require('nodemailer');
var moment = require('moment');

var common = {
    mailTransport: nodemailer.createTransport({
        host: 'smtp.exmail.qq.com',
        // service: 'smtp.exmail.qq.com',
        port: '465',
        secureConnection: true, // 使用SSL方式（安全方式，防止被窃取信息）
        auth: {
            user: 'support@bluestone.club',
            pass: 'BR6woDJ94B6sd2ii'
        },
    }),
    htmlTemp_register: function (obj, callback) {
        let selectChar = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        let code = '';
        for (let i = 0; i < 6; i++) {
            let charIndex = Math.floor(Math.random() * 26);
            code += selectChar[charIndex];
        }
        let html = '';
        switch (obj.type) {
            case 'register':
                html = '<div class="email">' +
                    '<div class="email_box">' +
                    '<h4 class="title_1">欢迎加入蓝石量化俱乐部</h4>' +
                    '<h6 class="title_2">' + obj.account + ',您好！</h6>' +
                    '<p>您的注册验证码是: <span class="code">' + code + '</span></p>' +
                    '<p>该验证码5分钟内有效，请尽快完成注册。</p>' +
                    '</div>' +
                    '<style>' +
                    '.email{width: 100%;background-color: rgb(240, 240, 240);}' +
                    '.email_box{box-shadow: 0 0 3px #ddd;border-bottom: 1px solid #e0e0e0;font-family: Helvetica, Verdana, sans-serif;color: #434343;max-width: 600px;overflow: hidden;padding: 40px;margin: 20px;}' +
                    '.title_1{text-align: center;}' +
                    '.code{font-weight: 600;}</style>' +
                    '</div>';

                pool.getConnection(function (err, connection) {
                    let data = new Date();
                    data.setMinutes(data.getMinutes() + 5);
                    let createTime = moment(data).format('YYYY-MM-DD HH:mm:ss');
                    connection.query(userSQL.insertCode, [code, obj.account, 0, createTime], function (err, result) {
                        if (!!result) {
                            connection.release();
                            callback(html)
                        } else {
                            callback(false)
                        }
                    })
                });
                break;
            case 'bonus':
                html = '<div class="email">' +
                    '<div class="email_box">' +
                    '<h4 class="title_1">蓝石量化系统提示</h4>' +
                    '<h6 class="title_2">尊敬的会员 ' + obj.account + ',您好！</h6>' +
                    '<p>您的机器人已经达到了支付会员盈利分红标准,避免机器人关闭，请及时支付平台分红!</p>' +
                    '<p>(注:在平台点击完成支付分红后,请务必上传<span class="code">已汇出</span>或<span class="code">已到账</span>的转账截图)</p>' +
                    '</div>' +
                    '<style>' +
                    '.email{width: 100%;background-color: rgb(240, 240, 240);}' +
                    '.email_box{box-shadow: 0 0 3px #ddd;border-bottom: 1px solid #e0e0e0;font-family: Helvetica, Verdana, sans-serif;color: #434343;max-width: 600px;overflow: hidden;padding: 40px;margin: 20px;}' +
                    '.title_1{text-align: center;}' +
                    '.code{font-weight: 600;color: #ff8227;}</style>' +
                    '</div>';

                callback(html);
                break;
        }
    },
    senEmailFn: function (param, calback) {
        var options = {
            from: '"蓝石量化俱乐部" <support@bluestone.club>',
            to: '<' + param.account + '>',
            subject: '蓝石量化俱乐部',
            html: '<h5>你好，这是一封来自蓝猫量化俱乐部的邮件！</h5><p>......</p>'
        };
        common.htmlTemp_register(param, function (result) {
            if (!!result) {
                options.html = result;
                mailTransport.sendMail(options, function (err, msg) {
                    if (err) {
                        let results = {
                            status: -200,
                            msg: err
                        };
                        calback(results);
                    }
                    else {
                        let results = {
                            status: 0,
                            msg: "已接收：" + msg.accepted
                        };
                        calback(results);
                    }
                });
            } else {
                let results = {
                    status: -200,
                    msg: '未处理异常!'
                };
                calback(results);
            }
        })
    },
};
module.exports = common;