var express = require('express');
var router = express.Router();
var uuid = require('node-uuid');

// 导入MySQL模块
var mysql = require('mysql');
var dbConfig = require('../db_models/DBConfig');
var userSQL = require('../db_models/usersql');
var moment = require('moment');


// 使用DBConfig.js的配置信息创建一个MySQL连接池
var pool = mysql.createPool(dbConfig.mysql);
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

//查询账户是否存在
router.post('/validName', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
// 获取前台页面传过来的参数
        var param = req.body || req.params;
// 建立连接 增加一个用户信息
        connection.query(userSQL.queryUser, [param.account], function (err, result) {
            let results = {};
            if (result.length > 0) {
                results = {
                    status: 0,
                    msg: '用户已存在'
                };
            } else {

            }
            // 以json形式，把操作结果返回给前台页面
            responseJSON(res, results);
            // 释放连接
            connection.release();

        });
    });
});

//获取用户信息
router.post('/getUser', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        var param = req.body || req.params;
        connection.query(userSQL.queryUserByOne, [param.account, param.uuid], function (err, result) {
            let results = {};
            if (result.length > 0) {
                connection.release();// 释放连接
                pool.getConnection(function (err, connection1) {
                    connection1.query(userSQL.getToken, [param.account], function (err, resultToken) {
                        let date = new Date(result[0].endtime);
                        let time = date.getTime();//转换成毫秒
                        let nowTime = new Date().getTime();//转换成毫秒
                        let times = time - nowTime;
                        if (times <= 0) {
                            times = 0;
                        }
                        let resDta = result[0];
                        resDta.endtime = times;
                        resDta['token'] = !!resultToken[0] ? resultToken[0].token : '';
                        resDta.password = '';
                        result = {
                            status: 0,
                            msg: '获取成功',
                            data: resDta
                        };
                        responseJSON(res, result);
                        // pool.end();
                        connection1.release();// 释放连接
                    });
                })
            } else {
                results = {
                    status: -200,
                    msg: '用户已丢失'
                };
                // 以json形式，把操作结果返回给前台页面
                responseJSON(res, results);
                // pool.end();
                // 释放连接
                connection.release();
            }
        });
    });
});

//用户修改相关资料信息
router.post('/useredit', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        // 从连接池获取连接
        pool.getConnection(function (err, connection) {
            var param = req.body || req.params;// 获取前台页面传过来的参数
            connection.query(userSQL.editUsers, [param.email, param.phone, param.nickname, param.apikey, param.secret, param.walletaddress, param.wechat, param.account, param.uuid], function (err, result) {// 建立连接 增加一个用户信息
                connection.query(userSQL.editBotAPI, [param.apikey, param.secret, param.account], function (err, result) {// 建立连接 增加一个用户信息
                    let results = {};
                    if (result) {
                        results = {
                            status: 0,
                            msg: '修改成功'
                        };
                    } else {

                    }
                    // 以json形式，把操作结果返回给前台页面
                    responseJSON(res, results);
                    // 释放连接
                    connection.release();

                });
            });
        });
    });
});

//用户修改相关资料信息
router.post('/useredit/level', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        var param = req.body || req.params;// 获取前台页面传过来的参数
        connection.query(userSQL.editUsers3, [param.level, param.account, param.uuid], function (err, result) {// 建立连接 增加一个用户信息
            let results = {};
            if (!!result) {
                results = {
                    status: 0,
                    msg: '修改成功'
                };
            } else {

            }
            // 以json形式，把操作结果返回给前台页面
            responseJSON(res, results);
            // 释放连接
            connection.release();

        });
    });
});

//设置和取消热门用户
router.put('/useredit/popular', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        var param = req.body || req.params;// 获取前台页面传过来的参数
        connection.query(userSQL.editUsers6, [param.popular_user, param.account, param.id], function (err, result) {// 建立连接 增加一个用户信息
            let results = {};
            if (!!result) {
                results = {
                    status: 0,
                    msg: '修改成功'
                };
            } else {

            }
            // 以json形式，把操作结果返回给前台页面
            responseJSON(res, results);
            // 释放连接
            connection.release();

        });
    });
});

//修改用户有效期信息（充值会员）
router.put('/useredit', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        var param = req.body || req.params;// 获取前台页面传过来的参数
        let strTime = new Date().getTime(),
            EndTime = '';
        let setStrTime = moment(strTime).format('YYYY-MM-DD HH:mm:ss');
        let list = [12, setStrTime, ''];
        param.time = param.time + '';
        if (param.type == 0) {//注册用户
            EndTime = new Date().getTime();
            list = [12, setStrTime, '(' + param.account + ')会员被管理员改为注册会员！'];
        }
        if (param.type == 1) {//试用用户
            if (param.endtimems > new Date().getTime()) {
                EndTime = param.endtimems + (86400000 * parseInt(param.time));
                list = [12, setStrTime, '(' + param.account + ')会员被管理员续试用会员' + param.time + '天'];
            } else {
                EndTime = new Date().getTime() + (86400000 * parseInt(param.time));
                list = [12, setStrTime, '(' + param.account + ')会员被管理员开通试用会员' + param.time + '天'];
            }
        }
        if (param.type == 2) {//购买用户
            if (param.time != 666) {
                if (param.endtimems > new Date().getTime()) {
                    EndTime = param.endtimems + 86400000 * (parseInt(param.time) * 30);
                    list = [12, setStrTime, '(' + param.account + ')会员被管理员续期购买会员一个月'];
                } else {
                    EndTime = new Date().getTime() + 86400000 * (parseInt(param.time) * 30);
                    list = [12, setStrTime, '(' + param.account + ')会员被管理员开通购买会员一个月'];
                }
            } else {
                if (param.endtimems > new Date().getTime()) {
                    EndTime = param.endtimems + 86400000 * parseInt(param.day);
                    list = [12, setStrTime, '(' + param.account + ')会员被管理员续期购买会员' + param.day + '天'];
                } else {
                    EndTime = new Date().getTime() + 86400000 * parseInt(param.day);
                    list = [12, setStrTime, '(' + param.account + ')会员被管理员开通购买会员' + param.day + '天'];
                }
            }
        }
        let setEndTime = moment(EndTime).format('YYYY-MM-DD HH:mm:ss');
        connection.query(userSQL.editUsers2, [param.type, setStrTime, setEndTime, param.bot_type, param.account, param.id], function (err, result) {// 建立连接 增加一个用户信息
            let results = {};
            if (result) {
                results = {
                    status: 0,
                    msg: '修改成功'
                };
            } else {
            }
            addLogsFn(connection, list, function () {
                responseJSON(res, results);
                // 释放连接
                connection.release();
            });
            // 以json形式，把操作结果返回给前台页面

        });
    });
});

//导入用户会员截止日期信息
router.put('/impuseredit', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        var param = req.body || req.params;// 获取前台页面传过来的参数
        let strTime = new Date().getTime(),
            EndTime = param.endtime + ':00',
            type = 2;
        EndTime = new Date(EndTime).getTime();
        param.time = param.time + '';
        if (EndTime <= strTime) {
            strTime = EndTime;
            type = 3;
        }
        let setStrTime = moment(strTime).format('YYYY-MM-DD HH:mm:ss');
        let setEndTime = moment(EndTime).format('YYYY-MM-DD HH:mm:ss');
        connection.query(userSQL.editUsers2_1, [type, setStrTime, setEndTime, param.Invitdcode, param.account], function (err, result) {// 建立连接 增加一个用户信息
            let results = {};
            if (result) {
                results = {
                    status: 0,
                    msg: '修改成功'
                };
            } else {

            }
            // 以json形式，把操作结果返回给前台页面
            responseJSON(res, results);
            // 释放连接
            connection.release();

        });
    });
});


//修改用户本金信息（设置本金）
router.put('/useredit/principal', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        var param = req.body || req.params;// 获取前台页面传过来的参数
        connection.query(userSQL.editUsers5, [param.user_principal, 0, param.account, param.id], function (err, result) {// 建立连接 增加一个用户信息
            let results = {};
            if (result) {
                results = {
                    status: 0,
                    msg: '修改成功'
                };
            }
            // 以json形式，把操作结果返回给前台页面
            responseJSON(res, results);
            // 释放连接
            connection.release();

        });
    });
});

//用户注册
router.post('/register', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        // 获取前台页面传过来的参数
        var param = req.body || req.params;
        let Invitdcode = s8();
        // 建立连接
        let resultData = {};
        let timeNum = new Date().getTime();
        let time = moment(timeNum).format('YYYY-MM-DD HH:mm:ss');
        connection.query(userSQL.queryUser, [param.account], function (err, uresult) {
            let results = {};
            if (uresult.length > 0) {
                results = {
                    status: -200,
                    msg: '用户已存在',
                    data: '用户已存在'
                };
                // 以json形式，把操作结果返回给前台页面
                responseJSON(res, results);
                // 释放连接
                connection.release();
                return;
            } else {
                connection.query(userSQL.queryUserCode, [param.invitcode], function (err, uresult) {
                    if (uresult.length <= 0) {
                        results = {
                            status: -200,
                            msg: '邀请码无效',
                            data: '邀请码无效'
                        };
                        // 以json形式，把操作结果返回给前台页面
                        responseJSON(res, results);
                        // 释放连接
                        connection.release();
                        return;
                    } else {
                        let data = new Date();
                        let createTime = moment(data).format('YYYY-MM-DD HH:mm:ss');
                        connection.query(userSQL.getEmailCode, [param.emailCode, param.account, 0, createTime], function (err, uresult) {
                            if (uresult.length <= 0) {
                                results = {
                                    status: -200,
                                    msg: '验证码已过期',
                                    data: '验证码已过期'
                                };
                                // 以json形式，把操作结果返回给前台页面
                                responseJSON(res, results);
                                // 释放连接
                                connection.release();
                                return;
                            } else {
                                connection.query(userSQL.insert, [param.account, param.password, param.email, param.phone, param.account, Invitdcode, param.invitcode, time], function (err, result) {
                                    if (!!result) {
                                        connection.query(userSQL.queryUser, [param.account], function (err, resultUser) {
                                                if (resultUser.length > 0) {
                                                    connection.query(userSQL.insertBot2, [resultUser[0].account], function (err, resultBot) {
                                                    })//写入用户默认bot配置数据
                                                    let token = uuid.v4()
                                                    connection.query(userSQL.addToken, [resultUser[0].account, token], function (err, result) {
                                                        connection.query(userSQL.insertInvit, [resultUser[0].account], function (err, result) {//写入对应关系
                                                            resultData = {
                                                                status: 0,
                                                                msg: '添加用户成功',
                                                                data: resultUser[0]
                                                            };
                                                            req.session.sessionId = token
                                                            resultData.sessionId = req.session.sessionId
                                                            responseJSON(res, resultData);
                                                        })
                                                    })
                                                }
                                                // 以json形式，把操作结果返回给前台页面
                                            }
                                        )
                                    }
                                    // 释放连接
                                    connection.release();
                                });
                            }
                        });
                    }
                });
            }
        });
    });
});

// 用户登录
router.post('/login', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        // 获取前台页面传过来的参数
        var param = req.body || req.params;
        // 建立连接
        connection.query(userSQL.confirmUser, [param.account, param.pwd], function (err, result) {
            let results = result;
            if (results.length > 0 && results[0].type != 3) {
                connection.query(userSQL.getToken, [param.account], function (err, resultToken) {
                    let date = new Date(result[0].endtime);
                    let time = date.getTime();//转换成毫秒
                    let nowTime = new Date().getTime();//转换成毫秒
                    let times = time - nowTime;
                    if (times <= 0) {
                        times = 0;
                    }
                    let resDta = results[0];
                    resDta.endtime = times;
                    resDta['token'] = !!resultToken[0] ? resultToken[0].token : '';
                    resDta.password = '';
                    result = {
                        status: 0,
                        msg: '登录成功',
                        data: resDta
                    };

                    // req.session.sessionId = uuid.v4()
                    result.sessionId = uuid.v4()
                    // 以json形式，把操作结果返回给前台页面
                    let create_time = moment(nowTime).format('YYYY-MM-DD HH:mm:ss');
                    let list = [0, create_time, '(' + param.account + ')会员登录本系统！' + 'key:' + param.authent];
                    addLogsFn(connection, list, function () {
                        responseJSON(res, result);
                        // 释放连接
                        connection.release();
                    });
                });
            } else if (results.length > 0 && results[0].type == 3) {
                result = {
                    status: 200,
                    msg: '用户已被停止使用,请联系代理',
                    data: '用户已被停止使用,请联系代理'
                };
                // 以json形式，把操作结果返回给前台页面
                responseJSON(res, result);
                // 释放连接
                connection.release();
            } else {
                result = {
                    status: 200,
                    msg: '用户名或密码错误',
                    data: '用户名或密码错误'
                };
                // 以json形式，把操作结果返回给前台页面
                responseJSON(res, result);
                // 释放连接
                connection.release();
            }
        });
    });
});

// 获取所有用户数据
router.get('/getalluser', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        // 建立连接
        let sql = userSQL.queryUserAll,
            countSql = userSQL.queryUserCount,
            list = [(parseInt(req.query.pageIndex) - 1) * parseInt(req.query.pageSize), parseInt(req.query.pageSize)],
            counList = [];
        if (!!req.query.name && !!req.query.type && !!req.query.state) {
            sql = userSQL.queryUserAll3
            countSql = userSQL.queryUserCount3
            list = ['%' + req.query.name + '%', req.query.type, req.query.state, (parseInt(req.query.pageIndex) - 1) * parseInt(req.query.pageSize), parseInt(req.query.pageSize)]
            counList = ['%' + req.query.name + '%', req.query.type, req.query.state]
        } else if (!!req.query.name && !!req.query.state) {
            sql = userSQL.queryUserAll1
            countSql = userSQL.queryUserCount1
            list = ['%' + req.query.name + '%', req.query.state, (parseInt(req.query.pageIndex) - 1) * parseInt(req.query.pageSize), parseInt(req.query.pageSize)]
            counList = ['%' + req.query.name + '%', req.query.state]
        } else if (!!req.query.name && !!req.query.type) {
            sql = userSQL.queryUserAll1_1
            countSql = userSQL.queryUserCount1_1
            list = ['%' + req.query.name + '%', req.query.type, (parseInt(req.query.pageIndex) - 1) * parseInt(req.query.pageSize), parseInt(req.query.pageSize)]
            counList = ['%' + req.query.name + '%', req.query.type]
        } else if (!!req.query.state && !!req.query.type) {
            sql = userSQL.queryUserAll1_2
            countSql = userSQL.queryUserCount1_2
            list = [req.query.type, req.query.state, (parseInt(req.query.pageIndex) - 1) * parseInt(req.query.pageSize), parseInt(req.query.pageSize)]
            counList = [req.query.type, req.query.state]
        } else if (!!req.query.name) {
            sql = userSQL.queryUserAll2_1
            countSql = userSQL.queryUserCount2_1
            list = ['%' + req.query.name + '%', (parseInt(req.query.pageIndex) - 1) * parseInt(req.query.pageSize), parseInt(req.query.pageSize)]
            counList = ['%' + req.query.name + '%',]
        } else if (!!req.query.type) {
            sql = userSQL.queryUserAll2
            countSql = userSQL.queryUserCount2
            list = [req.query.type, (parseInt(req.query.pageIndex) - 1) * parseInt(req.query.pageSize), parseInt(req.query.pageSize)]
            counList = [req.query.type]
        } else if (!!req.query.state) {
            sql = userSQL.queryUserAll2_2
            countSql = userSQL.queryUserCount2_2
            list = [req.query.state, (parseInt(req.query.pageIndex) - 1) * parseInt(req.query.pageSize), parseInt(req.query.pageSize)]
            counList = [req.query.state]
        }
        if (req.query.endtimetype == true || req.query.endtimetype == 'true') {
            sql = userSQL.queryUserAll5
            countSql = userSQL.queryUserAll5_1
            let time = new Date();
            let StrTime = moment(time).format('YYYY-MM-DD HH:mm:ss');
            time.setDate(time.getDate() + 3);
            time.setHours(23, 59, 59, 0);
            let EndTime = moment(time).format('YYYY-MM-DD HH:mm:ss');
            list = [StrTime, EndTime, (parseInt(req.query.pageIndex) - 1) * parseInt(req.query.pageSize), parseInt(req.query.pageSize)]
            counList = [StrTime, EndTime]
        }
        connection.query(sql, list, function (err, result) {
            if (!!result && result.length > 0) {
                connection.query(countSql, counList, function (err, resultCount) {
                    let sql = 'SELECT * FROM verification WHERE account in (';
                    result = result.map(function (item, index) {
                        let date = new Date(item.endtime);
                        let time = date.getTime();//转换成毫秒
                        let nowTime = new Date().getTime();//转换成毫秒
                        let times = time - nowTime;
                        if (times <= 0) {
                            time = 0;
                        }
                        item.endtime = times;
                        item.endtimems = time;
                        item.token = '--';
                        if (index < result.length - 1) {
                            sql += '\'' + item.account + '\',';
                        } else {
                            sql += '\'' + item.account + '\'';
                        }
                        return item;
                    });
                    sql += ')';
                    connection.query(sql, function (err, resultToken) {
                        result = result.map(function (item) {
                            resultToken.forEach(function (itemtoken) {
                                if (itemtoken.account == item.account) {
                                    item.token = itemtoken.token;
                                }
                            });
                            return item;
                        })
                        result = {
                            status: 0,
                            msg: '操作成功',
                            data: result,
                            count: resultCount[0].count
                        };
                        // 以json形式，把操作结果返回给前台页面
                        responseJSON(res, result);
                        // 释放连接
                        connection.release();
                    })
                })
            } else {
                result = {
                    status: 0,
                    msg: '没有更多数据',
                    data: [],
                    count: 0
                };
                // 以json形式，把操作结果返回给前台页面
                responseJSON(res, result);
                // 释放连接
                connection.release();
            }
        });
    });
});

// 获取所有用户数据
router.get('/getallinituser', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        // 建立连接
        connection.query(userSQL.queryUserAll4, [], function (err, result) {
            if (!!result) {
                result = {
                    status: 0,
                    msg: '操作成功',
                    data: result
                };
                // 以json形式，把操作结果返回给前台页面
                responseJSON(res, result);
            } else {
                result = {
                    status: 200,
                    msg: '未知处理异常'
                };
                // 以json形式，把操作结果返回给前台页面
                responseJSON(res, result);
            }
            // 释放连接
            connection.release();
        });
    });
});

// 禁用会员接口
router.put('/putUserByType', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        var param = req.body || req.params;// 获取前台页面传过来的参数
        let list = "'" + param.account + "'";
        offBotFn(connection, list, function () {
            // 建立连接 增加一个用户信息
            connection.query(userSQL.putUsersByType, [param.type, param.account, param.id], function (err, result) {
                if (!!result) {
                    result = {
                        status: 0,
                        msg: '操作成功',
                        data: result
                    };
                } else {
                    result = {
                        status: 200,
                        msg: '未知处理异常'
                    };
                }
                // 以json形式，把操作结果返回给前台页面
                let timeNum = new Date().getTime();
                let time = moment(timeNum).format('YYYY-MM-DD HH:mm:ss');
                let list = [3, time, '(' + param.account + ')会员被禁用,同时关闭机器人！'];
                addLogsFn(connection, list, function () {
                    responseJSON(res, result);
                    // 释放连接
                    connection.release();
                });
            });
        })
    });
});

//会员分组接口
router.put('/putUserByGroup', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        var param = req.body || req.params;// 获取前台页面传过来的参数
            // 建立连接
        connection.query(userSQL.putUsersByGroup, [param.group, param.account], function (err, result) {
            // 释放连接
            connection.release();
            if (!!result) {
                result = {
                    status: 0,
                    msg: '操作成功',
                    data: result
                };
            } else {
                result = {
                    status: 200,
                    msg: '未知处理异常'
                };
            }
            responseJSON(res, result);
        });
    });
});

// 关闭机器人公共方法
function offBotFn(connection, list, callback) {
    connection.query('UPDATE robot_parameter SET open = 0 WHERE user_account in (' + list + ')', function (err, result) {
        callback(result)
    });
}

//创建token的方法
function createToken(data, callback) {
    let token = uuid.v4()
    // 从连接池获取连接
    pool.getConnection(function (err, connection, next) {
        // 建立连接执行SQL
        connection.query(userSQL.getToken, [data.account], function (err, resultToken) {
            if (resultToken.length > 0) {
                connection.query(userSQL.setToken, [token, resultToken[0].id, data.account], function (err, result) {
                    callback(token)
                })
            } else {
                connection.query(userSQL.addToken, [data.account, token], function (err, result) {
                    callback(token)
                })
            }
        });
    });
}


// 获取token  创建或修改token
router.get('/api/gettoken/:account', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
// 获取前台页面传过来的参数
        let data = {
            account: req.params.account
        };
        createToken(data, function (token) {
            // let result = {
            //     status: 0,
            //     msg: '查询成功',
            //     data: data
            // };
            let obj = {
                token: token
            }
            responseJSON(res, obj);
//             // 释放连接
            connection.release();
        });
        // 释放连接
    });
});
//bot会员第一次登录重置密码


//用户重置资料信息
router.post('/user/repwd', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        var param = req.body || req.params;// 获取前台页面传过来的参数
        connection.query(userSQL.editUsers4_1, [param.pwd, param.account, param.uuid], function (err, result) {// 建立连接 修改一个用户信息
            if (!!result) {
                let results = {
                    status: 0,
                    msg: '操作成功'
                };
                let nowTime = new Date().getTime();//转换成毫秒
                let create_time = moment(nowTime).format('YYYY-MM-DD HH:mm:ss');
                let list = [13, create_time, '(' + param.account + ')会员被管理员重置密码！'];
                addLogsFn(connection, list, function () {
                    responseJSON(res, results);
                    connection.release();
                });
            } else {
                // 以json形式，把操作结果返回给前台页面
                responseJSON(res, result);
                // 释放连接
                connection.release();
            }
        });
    });
});

//用户修改相关资料信息-修改密码
router.post('/repwd', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        var param = req.body || req.params;// 获取前台页面传过来的参数
        connection.query(userSQL.editUsers8, [param.pwd, param.account, param.orPwd], function (err, result) {// 建立连接 修改一个用户信息
            if (result.changedRows > 0) {
                let results = {
                    status: 0,
                    msg: '操作成功'
                };
                // 以json形式，把操作结果返回给前台页面
                responseJSON(res, results);
            } else {
                let obj = {
                    status: -1,
                    msg: '帐号信息验证错误'
                };
                // 以json形式，把操作结果返回给前台页面
                responseJSON(res, obj);
            }
            // 释放连接
            connection.release();
        });
    });
});


//用户提交开通续费申请
router.post('/renew', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        // 获取前台页面传过来的参数
        var param = req.body || req.params;
        let timeNum = new Date().getTime();
        let time = moment(timeNum).format('YYYY-MM-DD HH:mm:ss');
        // 建立连接
        connection.query(userSQL.addRenew, [param.account, time, param.desc, param.price, param.data_time], function (err, result) {
            if (!!result) {
                result = {
                    status: 0,
                    msg: '提交成功'
                };
                responseJSON(res, result);
            }
            // 释放连接
            connection.release();
        });
    });
});

//用户获取开通续费申请列表
router.get('/getRenew/:account', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        // 建立连接
        connection.query(userSQL.getRenew, [req.params.account], function (err, result) {
            if (result.length > 0) {
                result.map(function (item) {
                    let date = new Date(item.create_time);
                    let time = date.getTime();//转换成毫秒
                    item.create_time = time;
                    return item
                });
                result = {
                    status: 0,
                    msg: '查询成功',
                    data: result
                };
                responseJSON(res, result);
            } else {
                result = {
                    status: -200,
                    msg: '没有更多数据',
                    data: []
                };
                responseJSON(res, result);
            }
            // 释放连接
            connection.release();
        });
    });
});

//用户获取开通续费申请列表
router.get('/getRenewList', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection, next) {
        // 建立连接
        let sql = userSQL.getRenewAll,
            countSql = userSQL.getRenewCount,
            list = [(parseInt(req.query.pageIndex) - 1) * parseInt(req.query.pageSize), parseInt(req.query.pageSize)],
            countList = [];
        if (!!req.query.type) {
            sql = userSQL.getRenewType;
            countSql = userSQL.getRenewCountByType;
            list = [req.query.type, (parseInt(req.query.pageIndex) - 1) * parseInt(req.query.pageSize), parseInt(req.query.pageSize)];
            countList = [req.query.type]
        }
        connection.query(sql, list, function (err, result) {
            if (!!result) {
                connection.query(countSql, countList, function (err, resultCount) {
                    result.forEach(function (item, index) {
                        let date = new Date(item.create_time);
                        let time = date.getTime();//转换成毫秒
                        item.create_time = time
                    })
                    result = {
                        status: 0,
                        msg: '操作成功',
                        data: result,
                        count: resultCount[0].count
                    };
                    // 以json形式，把操作结果返回给前台页面
                    responseJSON(res, result);
                })
            } else {
                result = {
                    status: 200,
                    msg: '未知处理异常'
                };
                // 以json形式，把操作结果返回给前台页面
                responseJSON(res, result);
            }
            // 释放连接
            connection.release();
        });
    });
});

//开通续费申请审核
router.put('/setRenewType', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        // 获取前台页面传过来的参数
        let param = req.body || req.params;
        if (!param) {
            result = {
                status: -1,
                msg: '操作失败,数据格式有误'
            };
            responseJSON(res, result);
            return;
        }
        let timeNum = new Date().getTime();
        let time = moment(timeNum).format('YYYY-MM-DD HH:mm:ss');
        // 建立连接执行SQL
        connection.query(userSQL.setRenewType, [param.type, param.desc, param.account, param.id], function (err, result) {
            if (!!result && param.type == 2) {
                connection.query(userSQL.queryUser, [param.account], function (err, result) {
                    if (result.length > 0) {
                        let paramUser = result[0];
                        let strTime = new Date().getTime(),
                            EndTime = new Date(paramUser.endtime).getTime();

                        let list = [];
                        if (EndTime > strTime) {
                            EndTime = EndTime + 31536000000;
                            list = [2, time, '确认会员(' + param.account + ')续费' + (param.bot_type == 1 ? '标准版' : (param.bot_type == 2 ? '专业版' : '精英版')) + '一年,费用:' + param.price + ';续费前到期时间:' + new Date(paramUser.endtime).toLocaleString() + ''];
                        } else {
                            EndTime = strTime + 31536000000;
                            list = [2, time, '确认会员(' + param.account + ')开通' + (param.bot_type == 1 ? '标准版' : (param.bot_type == 2 ? '专业版' : '精英版')) + '一年,费用:' + param.price + ';开通前到期时间:已过期;'];
                        }
                        let setStrTime = moment(strTime).format('YYYY-MM-DD HH:mm:ss');
                        if (paramUser.activation_state == 0 && !!paramUser.starttime) {
                            setStrTime = new Date(paramUser.starttime).getTime()
                            setStrTime = moment(setStrTime).format('YYYY-MM-DD HH:mm:ss')
                        }
                        let setEndTime = moment(EndTime).format('YYYY-MM-DD HH:mm:ss');
                        connection.query(userSQL.editUsers2, ['2', setStrTime, setEndTime, param.bot_type, paramUser.account, paramUser.id], function (err, result) {// 建立连接 增加一个用户信息
                            //开始分红操作
                            fenHongStartFn(connection, param, function (userList, state, restUser) {//获取支付邀请分红和盈利分红的用户详细
                                if (userList.length > 0) {//已经拿到直推和间推.
                                    let newList = [];
                                    initUserListFn(connection, restUser.Invitdcode, newList, state, restUser.teamlevel, function (newResult) {//开始递归查询团队整条线
                                        //     //开始记录分红
                                        let resUser = {
                                            Invitation: userList,
                                            team: newResult,
                                            price: param.price,
                                            account: param.account,
                                            type: 1
                                        };
                                        setFenHongRecordFn(connection, resUser, function (retData) {
                                            addLogsFn(connection, list, function () {
                                                result = {
                                                    status: 0,
                                                    msg: '操作成功'
                                                };
                                                responseJSON(res, result);
                                                connection.release();
                                            });
                                        })
                                    })
                                } else {//没有上级不需要分红  直接结束
                                    result = {
                                        status: 0,
                                        msg: '操作成功'
                                    };
                                    responseJSON(res, result);
                                    connection.release();
                                }
                            })
                        });
                    } else {
                        result = {
                            status: -1,
                            msg: '操作失败,未知处理异常'
                        };
                        responseJSON(res, result);
                        connection.release();
                    }
                });
            } else if (!!result) {
                result = {
                    status: 0,
                    msg: '修改成功'
                };
                responseJSON(res, result);
                connection.release();

            } else {
                result = {
                    status: -1,
                    msg: '操作失败,未知处理异常'
                };
                responseJSON(res, result);
                connection.release();

            }
        });
    });
});

//①查询需要支付分红的用户的直推和间推
function fenHongStartFn(connection, param, callback) {
    let userList = [];
    let dataList = [];
    connection.query(userSQL.getfenHongUser, [param.account], function (err, result) {
        if (!!result) {
            let data = result[0];
            if (!!data.Invitdcode && !!data.indirectcode) {
                let Invitdcode = {
                    account: '',//用户
                    bonus: 0,//分红
                    base: 0.15,//基数
                    Invitcode: data.Invitdcode,//邀请码
                };
                let indirectcode = {
                    account: '',//用户
                    bonus: 0,//分红
                    base: 0.08,//基数
                    Invitcode: data.indirectcode,//邀请码
                };
                userList.push(Invitdcode);
                userList.push(indirectcode);
                getUserByCodeFn(connection, userList, dataList, true, function (restList, state) {
                    callback(restList, state, data)
                })
            } else if (!!data.Invitdcode && !data.indirectcode) {
                let Invitdcode = {
                    account: '',//用户
                    bonus: 0,//分红
                    base: 0.15,//基数
                    Invitcode: data.Invitdcode,//邀请码
                };
                userList.push(Invitdcode);
                getUserByCodeFn(connection, userList, dataList, true, function (restList, state) {
                    callback(restList, state, data)
                })
            } else {
                callback(userList, true, data)
            }
        } else {
            callback(userList, true, '')
        }
    });
}

//②通过code获取用户--------主要用于查询直推和间推
function getUserByCodeFn(connection, list, data, state, callback) {
    connection.query(userSQL.getInUserData, [list[0].Invitcode], function (err, result) {
        if (!!result && result.length > 0) {
            let user = result[0];
            let objList = {
                account: user.account,//用户
                teamlevel: user.teamlevel,//等级
                Invitcode: user.Invitcode,//邀请码
                Invitdcode: user.Invitdcode,//受邀码
                bonus: 0,//分红
                base: list[0].base//基数
            };
            if (user.globalpartners == 1 && !!state) {
                objList.base = objList.base + 0.1
                state = false;
            }
            data.push(objList);
            list.shift();
            if (list.length > 0) {
                getUserByCodeFn(connection, list, data, state, function (restList) {
                    callback(restList, state)
                })
            } else {
                callback(data, state);
            }
        } else {
            callback(data, state)
        }
    });
}

//③分红的时候递归查询上级
function initUserListFn(connection, code, userList, state, level, callback) {
    connection.query(userSQL.getInUserData, [code], function (err, result) {
        if (!!result && result.length > 0) {
            let user = result[0];
            let objList = {
                account: user.account,//用户
                bonus: 0,//分红
                base: 0.00,//基数
                teamlevel: user.teamlevel,//等级
                Invitdcode: user.Invitdcode//直推码
            };
            if (user.globalpartners == 1 && !!state) {
                objList.base = parseInt((objList.base + 0.1) * 100) / 100;
                state = false;
            }
            if (userList.length <= 0 && user.teamlevel > level) {
                userList.push(objList);
            }
            if (userList.length > 0) {//判断权限层级
                let priData = userList[userList.length - 1];
                if (user.teamlevel > priData.teamlevel) {
                    userList.push(objList);
                }
            }
            if (!!user.Invitdcode) {
                initUserListFn(connection, user.Invitdcode, userList, state, level, function (restList) {
                    callback(restList)
                })
            } else {
                callback(userList);
            }
        } else {
            callback(userList)
        }
    });
}

//④开始记录分红
function setFenHongRecordFn(connection, obj, callback) {
    let values = [];
    let price = parseFloat(obj.price);
    let date = new Date();
    let time = date.getTime();//转换成毫秒
    time = moment(time).format('YYYY-MM-DD HH:mm:ss');
    let indExpPrice = 0;
    let teamExpPrice = 0;
    let indUserTxt = '';
    let teamUserTxt = '';
    for (let i in obj.Invitation) {
        let data = obj.Invitation[i];
        let list = ['' + data.account, 0, parseInt((price * data.base) * 100000) / 100000, '邀请分红收入', 0, 0, 0, 0, time, 0, '来自下级' + obj.account + '账户' + (obj.type == 1 ? '购买' : '盈利') + '分红', obj.type, 0];
        data.price = parseInt((price * data.base) * 100000) / 100000;
        indExpPrice = indExpPrice + parseInt((price * data.base) * 100000) / 100000;
        indUserTxt = indUserTxt + data.account + ',';
        values.push(list)
    }
    let maxBase = 0.12;
    for (let i in obj.team) {
        let data = obj.team[i];
        let index = obj.team.length - 1;
        if (i < index) {
            let base = 0;
            switch (data.teamlevel) {
                case '0':
                    base = 0.050;
                    break;
                case '1':
                    base = 0.030;
                    break;
                case '2':
                    base = 0.020;
                    break;
                case '3':
                    base = 0.020;
                    break;
            }
            maxBase = parseInt(maxBase * 100 - base * 100) / 100;
            data.base = parseInt(data.base * 100 + base * 100) / 100;
        } else {
            let base = 0;
            switch (data.teamlevel) {
                case '0':
                    base = maxBase > 0.05 ? 0.05 : maxBase;
                    break;
                case '1':
                    base = maxBase > 0.08 ? 0.08 : maxBase;
                    break;
                case '2':
                    base = maxBase > 0.1 ? 0.1 : maxBase;
                    break;
                case '3':
                    base = maxBase > 0.12 ? 0.12 : maxBase;
                    break;
            }
            data.base = parseInt(data.base * 100 + base * 100) / 100;
        }
        data.price = parseInt((price * data.base) * 100000) / 100000;
        let list = ['' + data.account, 0, parseInt((price * data.base) * 100000) / 100000, '邀请分红收入', 0, 0, 0, 0, time, 0, '来自团队成员' + obj.account + '账户' + (obj.type == 1 ? '购买' : '盈利') + '分红', obj.type, 0];
        teamExpPrice = teamExpPrice + parseInt((price * data.base) * 100000) / 100000;
        teamUserTxt = teamUserTxt + data.account + ',';
        values.push(list)
    }
    connection.query(userSQL.insertFenHong, [values], function (err, result) {
        let txt = '';
        let id = 11;
        if(obj.type == 1){
            txt = '(' + obj.account + ')购买会员分红,费用:' + price + ';分给推广会员:' + obj.Invitation.length + '位,' + indUserTxt + ';共计分红金额:' + indExpPrice + ';分给团队会员:' + obj.team.length + '位' + teamUserTxt + ';共计分红金额:' + teamExpPrice + ';总计分红金额:' + (teamExpPrice + indExpPrice)
        }else {
            txt = '(' + obj.account + ')盈利分红转账,费用:' + price + ';分给推广会员:' + obj.Invitation.length + '位,' + indUserTxt + ';共计分红金额:' + indExpPrice + ';分给团队会员:' + obj.team.length + '位' + teamUserTxt + ';共计分红金额:' + teamExpPrice + ';总计分红金额:' + (teamExpPrice + indExpPrice)
            id = 5
        }
        if (!!result) {
            let list = [id, time, txt];
            addLogsFn(connection, list, function () {
                callback(result);
            });
        } else {
            callback(err);
        }
    });
}

//平台分红方法测试
router.post('/test', function (req, res, next) {
// function HandleABonusFn (connection,param,callback){

    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        // 获取前台页面传过来的参数
        fenHongStartFn(connection, param, function (userList, state, restUser) {//获取支付邀请分红和盈利分红的用户详细
            if (userList.length > 0) {//已经拿到直推和间推.
                let newList = [];
                initUserListFn(connection, restUser.Invitdcode, newList, state, restUser.teamlevel, function (newResult) {//开始递归查询团队整条线
                    //     //开始记录分红
                    let resUser = {
                        Invitation: userList,
                        team: newResult,
                        price: param.price,
                        account: param.account,
                        type: 1
                    };
                    setFenHongRecordFn(connection, resUser, function (retData) {
                        callback(retData)
                    })
                })
            } else {//没有上级不需要分红  直接结束
                callback(userList)
            }
        })
    })
});


//平台分红转账提交
router.post('/addBonus', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        // 获取前台页面传过来的参数
        var param = req.body || req.params;
        let timeNum = new Date().getTime();
        let time = moment(timeNum).format('YYYY-MM-DD HH:mm:ss');
        // 建立连接
        connection.query(userSQL.addBonus, [param.account, time, param.price, param.base, param.desc], function (err, result) {
            if (!!result) {
                result = {
                    status: 0,
                    msg: '提交成功'
                };
                responseJSON(res, result);
            }
            // 释放连接
            connection.release();
        });
    });
});

//平台充值记录统计
router.get('/countRenewSum', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        connection.query(userSQL.countRenewSum, function (err, result) {
            if (!!result) {
                result = {
                    status: 0,
                    msg: '提交成功',
                    count: result[0].countPrice
                };
                responseJSON(res, result);
            }
            // 释放连接
            connection.release();
        });
    });
});

//平台提现记录统计
router.get('/countPutSum', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        connection.query(userSQL.countPutSum, function (err, result) {
            if (!!result) {
                result = {
                    status: 0,
                    msg: '提交成功',
                    count: result[0].countPrice
                };
                responseJSON(res, result);
            }
            // 释放连接
            connection.release();
        });
    });
});

//平台分红记录统计
router.get('/countBonusSum', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        connection.query(userSQL.countBonusSum, function (err, result) {
            if (!!result) {
                result = {
                    status: 0,
                    msg: '提交成功',
                    count: result[0].countPrice
                };
                responseJSON(res, result);
            }
            // 释放连接
            connection.release();
        });
    });
});

//平台分红转账提交审核
router.put('/setBonusType', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        // 获取前台页面传过来的参数
        let param = req.body || req.params;
        if (!param) {
            result = {
                status: -1,
                msg: '操作失败,数据格式有误'
            };
            responseJSON(res, result);
            return;
        }
        let time = new Date().getTime()
        let create_time = moment(time).format('YYYY-MM-DD HH:mm:ss');
        // 建立连接执行SQL
        connection.query(userSQL.setBonusType, [param.type, param.desc, param.account, param.id], function (err, result) {
            if (!!result && param.type == 2) {
                connection.query(userSQL.queryUser, [param.account], function (err, result) {
                    if (result.length > 0) {
                        let paramUser = result[0];
                        connection.query(userSQL.editUsers5, [paramUser.user_principal, param.base, paramUser.account, paramUser.id], function (err, result) {// 建立连接 修改一个用户信息
                            //开始分红操作
                            fenHongStartFn(connection, param, function (userList, state, restUser) {//获取支付邀请分红和盈利分红的用户详细
                                if (userList.length > 0) {//已经拿到直推和间推.
                                    let newList = [];
                                    initUserListFn(connection, restUser.Invitdcode, newList, state, restUser.teamlevel, function (newResult) {//开始递归查询团队整条线
                                        //     //开始记录分红
                                        let resUser = {
                                            Invitation: userList,
                                            team: newResult,
                                            price: param.price,
                                            account: param.account,
                                            type: 2
                                        };
                                        setFenHongRecordFn(connection, resUser, function (retData) {
                                            result = {
                                                status: 0,
                                                msg: '操作成功'
                                            };
                                            responseJSON(res, result);
                                            connection.release();
                                            // addLogsFn(connection, list, function () {
                                            // });
                                        })
                                    })
                                } else {//没有上级不需要分红  直接结束
                                    result = {
                                        status: 0,
                                        msg: '操作成功'
                                    };
                                    responseJSON(res, result);
                                    connection.release();
                                }
                            })


                        });
                    } else {
                        result = {
                            status: -1,
                            msg: '操作失败,未知处理异常'
                        };
                        let list = [10, create_time, '确认会员(' + param.account + ')分红转账异常！'];
                        addLogsFn(connection, list, function () {
                            responseJSON(res, result);
                            connection.release();
                        });
                    }
                });
            } else if (!!result) {
                result = {
                    status: 0,
                    msg: '修改成功'
                };
                //写入操作日志
                let list = [7, create_time, '会员(' + param.account + ')分红转账无效，已拒绝！'];
                addLogsFn(connection, list, function () {
                    responseJSON(res, result);
                    connection.release();
                });

            } else {
                result = {
                    status: -1,
                    msg: '操作失败,未知处理异常'
                };
                responseJSON(res, result);
                connection.release();

            }
        });
    });
});

//用户获取开通续费申请列表
router.get('/getBonus/:account/:pageIndex/:pageSize', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        // 建立连接
        connection.query(userSQL.getBonus, [req.params.account, (parseInt(req.params.pageIndex) - 1) * parseInt(req.params.pageSize), parseInt(req.params.pageSize)], function (err, result) {
            connection.query(userSQL.getBonusCountByUser, [req.params.account], function (err, resultCount) {
                if (result.length > 0) {
                    result.map(function (item) {
                        let date = new Date(item.create_time);
                        let time = date.getTime();//转换成毫秒
                        item.create_time = time;
                        return item
                    });
                    result = {
                        status: 0,
                        msg: '查询成功',
                        data: result,
                        count: resultCount[0].count
                    };
                    responseJSON(res, result);
                } else {
                    result = {
                        status: 0,
                        count: 0,
                        msg: '没有更多数据',
                        data: []
                    };
                    responseJSON(res, result);
                }
                // 释放连接
                connection.release();
            });
        });
    });
});

//用户获取开通续费申请列表
router.get('/getBonusList', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection, next) {
        // 建立连接
        let sql = userSQL.getBonusAll,
            countSql = userSQL.getBonusCount,
            list = [(parseInt(req.query.pageIndex) - 1) * parseInt(req.query.pageSize), parseInt(req.query.pageSize)],
            countList = [];
        if (!!req.query.type) {
            sql = userSQL.getBonusType;
            countSql = userSQL.getBonusCountByType;
            list = [req.query.type, (parseInt(req.query.pageIndex) - 1) * parseInt(req.query.pageSize), parseInt(req.query.pageSize)];
            countList = [req.query.type]
        }
        connection.query(sql, list, function (err, result) {
            if (!!result) {
                connection.query(countSql, countList, function (err, resultCount) {
                    result.forEach(function (item, index) {
                        let date = new Date(item.create_time);
                        let time = date.getTime();//转换成毫秒
                        item.create_time = time
                    })
                    result = {
                        status: 0,
                        msg: '操作成功',
                        data: result,
                        count: resultCount[0].count
                    };
                    // 以json形式，把操作结果返回给前台页面
                    responseJSON(res, result);
                })
            } else {
                result = {
                    status: 200,
                    msg: '未知处理异常'
                };
                // 以json形式，把操作结果返回给前台页面
                responseJSON(res, result);
            }
            // 释放连接
            connection.release();
        });
    });
});

// 写入日志的公共方法
function addLogsFn(connection, list, callback) {
    connection.query(userSQL.addLogs, list, function (err, result) {
        callback(result)
    });
}


function s8() {
    var data = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    // for (var j = 0; j < line; j++) {    //500为想要产生的行数
    let result = "";
    for (var i = 0; i < 8; i++) {   //产生8位就使i<8
        let r = Math.floor(Math.random() * 62);     //16为数组里面数据的数量，目的是以此当下标取数组data里的值！
        result += data[r];        //输出20次随机数的同时，让rrr加20次，就是20位的随机字符串了。
    }
    return result;
}


module.exports = router;
