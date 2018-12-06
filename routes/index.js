var express = require('express');
var router = express.Router();

// 导入MySQL模块
var mysql = require('mysql');
var dbConfig = require('../db_models/DBConfig');
var userSQL = require('../db_models/usersql');
var uuid = require('node-uuid');
var moment = require('moment');
var schedule = require('node-schedule');
var async = require('async');
const fetch = require('node-fetch');

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

//验证token的方法
function generateToken(connection, data, callback) {
    // 从连接池获取连接
    // 建立连接执行SQL
    connection.query(userSQL.getTokenCheck, [data.account, data.token], function (err, result) {
        if (result.length > 0) {
            callback(true)
        } else {
            callback(false)
        }
    });
}

// 查询会员数据
router.post('/getcodeuser', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
// 获取前台页面传过来的参数
        var param = req.body || req.params;
        let data = {
            child: []
        };
        forEachData(connection, param.Invitcode, data, function () {
            let result = {
                status: 0,
                msg: '查询成功',
                data: data
            };
            responseJSON(res, result);
//             // 释放连接
            connection.release();
        });
        // 释放连接
    });
});

// 查询会员数据(一级一级往下查询)
router.post('/getcode/user', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
// 获取前台页面传过来的参数
        var param = req.body || req.params;
        connection.query(userSQL.queryUsers, [param.Invitcode], function (err, result) {
            result = {
                status: 0,
                msg: '查询成功',
                data: result
            };
            responseJSON(res, result);
        });
        // 释放连接
        connection.release();
    });
});

// 查询会员数据(一级一级往上查询)
router.post('/getcode/user/father', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
// 获取前台页面传过来的参数
        var param = req.body || req.params;
        connection.query(userSQL.queryUsersFather, [param.Invitcode], function (err, result) {
            result = {
                status: 0,
                msg: '查询成功',
                data: result
            };
            responseJSON(res, result);
        });
        // 释放连接
        connection.release();
    });
});

//查询会员递归
function forEachData(connection, code, data, callback) {
    query(connection, code, function (result) {
        let length = result.length;
        if (length > 0) {
            result.forEach((item, index) => {
                data.child[index] = {
                    id: item.id,
                    name: item.account,
                    Invitcode: item.Invitcode,
                    type: item.type,
                    apikey: item.apikey,
                    level: item.level,
                    bot_type: item.bot_type,
                    globalpartners: item.globalpartners,
                    child: []
                };
                forEachData(connection, item.Invitcode, data.child[index], function () {
                    length--;
                    if (length <= 0) {
                        !callback ? '' : callback();
                    }
                })

            })
        } else {
            !callback ? '' : callback();
        }
    })
}

//查询会员
function query(connection, code, callback) {
    connection.query(userSQL.queryUsers, [code], function (err, result) {
        callback(result)
    });
}

// 获取机器人数据
// router.get('/getBot', function (req, res) {
router.get('/api/parameters/:user_account', function (req, res) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        //查询用户
        let uuid = (req.params.user_account).split('bs')[1];
        connection.query(userSQL.queryUserByUUId, [uuid], function (err, userResult) {
            if (!!userResult && userResult.length > 0) {
                let obj = {
                    account: userResult[0].account,
                    token: req.get('Authorization')
                };
                generateToken(connection, obj, function (bool) {
                    if (!bool && obj.token !== 'www.bluestone.club') {
                        let result = {
                            status: -200,
                            msg: '身份验证失败'
                        };
                        responseJSON(res, result);
                        connection.release();
                    } else {
                        // 获取前台页面传过来的参数
                        connection.query(userSQL.getBot, [obj.account], function (err, result) {
                            if (result.length > 0) {
                                let obj = result[0];
                                obj.open = obj.open == 0 ? false : true
                                obj.trendfollow = obj.trendfollow == 0 ? false : true
                                // obj.longorder = obj.longorder == 0 ? false : true;
                                // obj.shortorder = obj.shortorder == 0 ? false : true;
                                obj.doten = obj.doten == 0 ? false : true;
                                obj.longorder = parseInt(obj.longorder);
                                obj.shortorder = parseInt(obj.shortorder);
                                obj.mm = parseInt(obj.mm);
                                obj.nanpin = parseInt(obj.nanpin);
                                obj.maxnanpin = parseInt(obj.maxnanpin);
                                obj.maxleverage = parseInt(obj.maxleverage);
                                obj.leverage = parseInt(obj.leverage);
                                obj.sleep = parseInt(obj.sleep);
                                obj.longrange = parseInt(obj.longrange);
                                obj.longstop = parseInt(obj.longstop);
                                obj.shortrange = parseInt(obj.shortrange);
                                obj.shortstop = parseInt(obj.shortstop);
                                obj.time = parseInt(obj.time);
                                obj.longstopx = parseInt(obj.longstopx);
                                obj.shortstopx = parseInt(obj.shortstopx);
                                obj.nanpin_order = parseInt(obj.nanpin_order);
                                obj.mmnanpin = parseFloat(obj.mmnanpin);
                                obj.nanpin_cancel = parseFloat(obj.nanpin_cancel);
                                obj.losscut = parseFloat(obj.losscut);
                                // obj.longmao_open = obj.longmao_open == 0 ? false : true;
                                let result1 = {
                                    status: 0,
                                    msg: '查询成功',
                                    data: obj
                                };
                                responseJSON(res, obj);
                            }
                            // 以json形式，把操作结果返回给前台页面
                            // 释放连接
                            connection.release();

                        });
                    }
                })
            } else {
                let result = {
                    status: -1,
                    msg: '操作失败,身份验证失败'
                };
                connection.release();
                responseJSON(res, result);
            }

        })
    });
});
router.get('/controlGetBot/:user_account', function (req, res) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
        connection.query(userSQL.getBot, [req.params.user_account], function (err, result) {
            if (result.length > 0) {
                let obj = result[0];
                obj.open = obj.open == 0 ? false : true
                obj.trendfollow = obj.trendfollow == 0 ? false : true
                // obj.longorder = obj.longorder == 0 ? false : true;
                // obj.shortorder = obj.shortorder == 0 ? false : true;
                obj.doten = obj.doten == 0 ? false : true;
                obj.longorder = parseInt(obj.longorder);
                obj.shortorder = parseInt(obj.shortorder);
                obj.mm = parseInt(obj.mm);
                obj.nanpin = parseInt(obj.nanpin);
                obj.maxnanpin = parseInt(obj.maxnanpin);
                obj.maxleverage = parseInt(obj.maxleverage);
                obj.leverage = parseInt(obj.leverage);
                obj.sleep = parseInt(obj.sleep);
                obj.longrange = parseInt(obj.longrange);
                obj.longstop = parseInt(obj.longstop);
                obj.shortrange = parseInt(obj.shortrange);
                obj.shortstop = parseInt(obj.shortstop);
                obj.time = parseInt(obj.time);
                obj.longstopx = parseInt(obj.longstopx);
                obj.shortstopx = parseInt(obj.shortstopx);
                obj.nanpin_order = parseInt(obj.nanpin_order);
                obj.mmnanpin = parseFloat(obj.mmnanpin);
                obj.nanpin_cancel = parseFloat(obj.nanpin_cancel);
                obj.losscut = parseFloat(obj.losscut);
                // obj.longmao_open = obj.longmao_open == 0 ? false : true;
                let result1 = {
                    status: 0,
                    msg: '查询成功',
                    data: obj
                };
                responseJSON(res, result1);
            }
            // 以json形式，把操作结果返回给前台页面
            // 释放连接
            connection.release();

        });
    });
});
// 设置机器人参数数据
router.put('/setBot', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
// 获取前台页面传过来的参数
        let param = req.body || req.params;
        let list = [
            param.bot.api,//api
            param.bot.secret,//secret
            param.bot.open,//开关机器人
            param.bot.entry,//固定金额                                      ---自定义头寸
            param.bot.trendfollow,//选上了做顺势交易，不选做逆势交易            ---趋势交易
            param.bot.mm,//启动复利自动本金管理，0是关闭，1是启动                 ---自动管理MM
            param.bot.mmpercent,//保证金使用率                                 ---MM头寸比例
            param.bot.nanpin,//每次补仓合约数量，单位美金                        ---自定义补仓
            param.bot.maxnanpin,//最大补仓次数，单位次                         ---最大补仓次数
            param.bot.mmnanpin,//MM每次补仓的比例                              ---自动补仓比例
            param.bot.maxleverage,//大补仓持仓数量=50杠杆*本金                 ----最大持仓
            param.bot.leverage,//bitmex杠杆指定。０表示全仓                       ---杠杆
            param.bot.sleep,//循环时间推荐40或70，单位秒                          ---刷新时间
            param.bot.longrange,//买涨时的止盈幅度，单位美金                       ---多军止盈间距
            param.bot.longstop,//买涨被套后补仓价格间距，单位美金                   ---多军补仓间距
            param.bot.shortrange,//卖空时的止盈幅度，单位美金                      ---空军止盈间距
            param.bot.shortstop,//卖空被套后补仓价格间距，单位美金                  ---空军补仓间距
            param.bot.losscut,//根据钱包余额实时计算止损金额。(1表示不止损)          ---Losscut
            param.bot.time,//k线指标:1表示1分钟线，5表示5分钟线                     ---K线
            param.bot.longstopx,//当多军的时候价格偏离多少美金后止损                 ---多军点位止损
            param.bot.shortstopx,//当空军的时候价格偏离多少美金后止损                ---空军点位止损
            param.bot.longorder,//只做多军的单边交易                               ---多军单边
            param.bot.shortorder,//只做空军的单边交易                              ---空军单边
            param.bot.nanpin_cancel,//是否选择空手道策略                           ---空手道
            param.bot.nanpin_order,//1=高速补仓0=低速补仓,-1=保持现状                ---
            param.bot.doten,//反手光环                                          ---反手光环
            param.bot.user_account
        ];
        let list2 = [
            param.bot.api,//secret
            param.bot.secret,//secret
            param.bot.user_account
        ]

// 建立连接 查询所有信息
        connection.query(userSQL.putBot, list, function (err, result) {
            connection.query(userSQL.editUsersAPI, list2, function (err, result) {
                if (!!result) {
                    if (!!param.logs) {//记录操作日志
                        let time = new Date().getTime();
                        let createTime = moment(time).format('YYYY-MM-DD HH:mm:ss');
                        let list3 = [param.logs.operator, createTime, param.logs.account, param.logs.record, param.logs.ip];
                        connection.query(userSQL.addBotLogs, list3, function (err, result) {
                            result = {
                                status: 0,
                                data: list,
                                msg: '修改成功'
                            };
                            connection.release();
                            responseJSON(res, result);
                        })
                    } else {
                        result = {
                            status: 0,
                            data: list,
                            msg: '修改成功'
                        };
                        connection.release();
                        responseJSON(res, result);
                    }
                } else {
                    result = {
                        status: -1,
                        msg: '操作失败,未知处理异常'
                    };
                    connection.release();
                    responseJSON(res, result);
                }
                // 以json形式，把操作结果返回给前台页面
            });
        });
    });
});
//查询设置用户机器人操作日志
router.get('/getBotLogs/:pageIndex/:size', function (req, res, next) {
    // 从连接池获取连接
    let param = req.params;
    pool.getConnection(function (err, connection, next) {
        // 建立连接执行SQL
        connection.query(userSQL.getBotLogs, [(parseInt(param.pageIndex) - 1) * parseInt(param.size), parseInt(param.size)], function (err, result) {
            if (!!result && result.length > 0) {
                result = {
                    status: 0,
                    msg: '查询成功',
                    data: result
                };
                connection.release();
                responseJSON(res, result);
            } else {
                result = {
                    status: 0,
                    data: [],
                    msg: '未获取到任何数据'
                };
                connection.release();
                responseJSON(res, result);
            }
        });
    });
});

// 写入机器人状态 增加同时设置持仓参数/setBot/state
router.put('/api/status_balance/:user_account', function (req, res, next) {
    // 从连接池获取连接
    let param = req.body;
    if (!param) {
        let result = {
            status: -1,
            msg: '操作失败,数据格式有误'
        };
        responseJSON(res, result);
        return;
    }
    pool.getConnection(function (err, connection) {
// 获取前台页面传过来的参数
        let uuid = (req.params.user_account).split('bs')[1];
        //查询用户
        connection.query(userSQL.queryUserByUUId, [uuid], function (err, userResult) {
            if (userResult.length <= 0) {
                let result = {
                    status: -1,
                    msg: '操作失败,身份验证失败'
                };
                connection.release();
                responseJSON(res, result);
                return;
            }
            userResult[0]['user_account'] = userResult[0].account;
            let timeNum = new Date().getTime();
            let time = moment(timeNum).format('YYYY-MM-DD HH:mm:ss');
            let list = [
                time,//创建时间
                param.level || '',//机器人等级
                param.new_position_qty || '',//头寸金额
                param.bot_nanpin || '',//补仓金额
                param.max_position_qty || '',//最大持仓
                param.nanpin_count || '',//已补次数
                param.status || '',//机器人当前状态
                param.bot_side || '',//持仓方向
                param.bot_size || '',//持仓数量
                param.bot_avgEntryPrice || '',//持仓均价
                param.bot_liquidationPrice || '',//爆仓点位
                param.bot_mex_last || '0',//当前最新价格
                param.bot_balance || '0',//当前最新价格
                userResult[0].user_account || ''
            ];

            let listHold = [
                userResult[0].user_account || '',//用户
                param.bot_balance || '',//余额
                param.bot_change_num || '',//资金变动值
                param.bot_side || '',//持仓方向
                param.bot_size || '',//持仓数量
                param.bot_avgEntryPrice || '',//持仓均价
                param.bot_liquidationPrice || '',//爆仓点位
                param.bot_mex_last || '',//当前最新价格
                time,               //数据写入时间
                param.bot_warn_state || '',//数据状态  是否有警告
                param.status || '',//数据警告内容
                !!param.type ? param.type : 0, //数据类型: 0 盈利数据   1 邀请分红数据  2 团队分红数据 3提现数据  4上级分佣抽成
                !!param.bot_lirun ? param.bot_lirun : 0 //盈亏合计字段
            ];
            if (!param.level && !param.bot_lirun) {//记录用户使用杠杆字段
                connection.query(userSQL.queryBot, [userResult[0].user_account], function (err, result) {
                    if (!!result && result.length > 0) {
                        connection.query(userSQL.putBotState1, [parseFloat(param.marginLeverage).toFixed(1), userResult[0].user_account], function (err, result) {
                            if (!!result) {
                                result = {
                                    status: 0,
                                    msg: '修改成功'
                                };
                                responseJSON(res, result);
                            } else {
                                result = {
                                    status: -1,
                                    msg: '操作失败,未知处理异常'
                                };
                                responseJSON(res, result);
                            }
                            connection.release();
                        });
                    }
                });
            }
            else {
                if (userResult[0].user_principal == 0) {
                    //写入用户本金
                    //connection.query(userSQL.editUsers5, [parseFloat(param.bot_balance),parseFloat(param.bot_balance),req.params.user_account,userResult[0].id], function (err, userResult) {})
                    connection.query(userSQL.editUsers5, [parseFloat(param.bot_balance), 0, userResult[0].user_account, userResult[0].id], function (err, eduser) {
                    })
                }
                if (!!param.bot_lirun) {//记录用户的盈利和盈利基数
                    if ((userResult[0].bonus_base == 9999 || !userResult[0].bonus_base) && !!param.bot_lirun) {
                        connection.query(userSQL.editUsers5_1, [parseFloat(param.bot_lirun).toFixed(6), parseFloat(param.bot_lirun).toFixed(6), userResult[0].user_account, userResult[0].id], function (err, eduser) {
                            connection.query(userSQL.putBotState2, [param.bot_prevDeposited, param.bot_prevWithdrawn, param.bot_amount, param.bot_lirun, userResult[0].user_account], function (err, eduser) {
                                let result = {
                                    status: 0,
                                    msg: '记录充值提现数据。不做记录'
                                };
                                responseJSON(res, result);
                                connection.release();
                            })
                        })
                    } else {//第一次写入会员收取分红的基数点
                        let bonus_ratio = Math.abs(((parseFloat(param.bot_prevDeposited) - parseFloat(param.bot_prevWithdrawn)) * 0.15).toFixed(6));
                        if (userResult[0].bonus_ratio == 9999 && bonus_ratio > 0) {//第一次写入会员收取分红的基数点
                            connection.query(userSQL.editUsers5_3, [parseFloat(param.bot_lirun).toFixed(6), bonus_ratio, userResult[0].user_account, userResult[0].id], function (err, eduser) {
                                connection.query(userSQL.putBotState2, [param.bot_prevDeposited, param.bot_prevWithdrawn, param.bot_amount, param.bot_lirun, userResult[0].user_account], function (err, eduser) {
                                    let result = {
                                        status: 0,
                                        msg: '记录充值提现数据。不做记录'
                                    };
                                    responseJSON(res, result);
                                    connection.release();
                                })
                            })
                        } else {
                            connection.query(userSQL.editUsers5_2, [parseFloat(param.bot_lirun).toFixed(6), userResult[0].user_account, userResult[0].id], function (err, eduser) {
                                connection.query(userSQL.putBotState2, [param.bot_prevDeposited, param.bot_prevWithdrawn, param.bot_amount, param.bot_lirun, userResult[0].user_account], function (err, eduser) {
                                    let result = {
                                        status: 0,
                                        msg: '记录充值提现数据。不做记录'
                                    };
                                    responseJSON(res, result);
                                    connection.release();
                                })
                            })
                        }
                    }
                } else {//记录机器人数据
                    if (userResult[0].activation_state == 0) {//需要激活
                        let strTime = new Date(userResult[0].starttime).getTime(),
                            NowTime = new Date().getTime(),
                            EndTime = new Date(userResult[0].endtime).getTime();
                        if (strTime < NowTime) {
                            EndTime = EndTime + (NowTime - strTime)
                        }
                        let setStrTime = moment(strTime).format('YYYY-MM-DD HH:mm:ss');
                        let setEndTime = moment(EndTime).format('YYYY-MM-DD HH:mm:ss');
                        connection.query(userSQL.editUsers7, [setEndTime, param.bot_lirun, userResult[0].user_account, userResult[0].id], function (err, eduser) {
                        })
                        let logList = [6, time, '会员[' + userResult[0].user_account + ']机器人确认激活。'];
                        addLogsFn(connection, logList, function () {
                        });
                    }
                    // else {
                    //     if ((userResult[0].bot_lirun - parseFloat(userResult[0].bonus_base)).toFixed(4) >= 0.1400) {//判断是否超出会员盈利。超出关闭机器人
                    //         let list = "'" + req.params.user_account + "'";
                    //         offBotFn(list, function () {
                    //             let logList = [8, time, '会员[' + req.params.user_account + ']的盈利超出,机器人已关闭!'];
                    //             addLogsFn(connection, logList, function () {
                    //             });
                    //         })
                    //         // connection.query(userSQL.offBot, list, function (err, userResult) {})
                    //     }
                    // }
                    //  先查询上一条，时间如果不满足，不允许写入
                    connection.query(userSQL.getRecord, [userResult[0].user_account], function (err, getResult) {
                        let data = '',
                            time = new Date(data),
                            upTime = time.getTime();
                        if (getResult.length <= 0) {
                            data = new Date();
                            data.setDate(data.getDate() - 1);
                            let createTime = moment(data).format('YYYY-MM-DD HH:mm:ss');
                            let NewlistHold = JSON.parse(JSON.stringify(listHold)); //this.templateData是父组件传递的对象  ;
                            NewlistHold[8] = createTime;
                            connection.query(userSQL.insertHold, NewlistHold, function (err, result) {
                            })
                            connection.query(userSQL.insertHold2, NewlistHold, function (err, result) {
                            })
                            data = data.getTime();
                        } else {
                            data = getResult[0].bot_set_time;
                        }
                        //每60分鐘左右寫入一次
                        if (timeNum - upTime < 3600000) {//不足60分钟
                            connection.query(userSQL.queryBot, [userResult[0].user_account], function (err, result) {
                                if (result.length <= 0) {
                                    connection.query(userSQL.insertBotState, list, function (err, result) {
                                        if (!!result) {
                                            result = {
                                                status: 0,
                                                msg: '修改成功'
                                            };
                                            responseJSON(res, result);
                                        } else {
                                            result = {
                                                status: -1,
                                                msg: '操作失败,未知处理异常'
                                            };
                                            responseJSON(res, result);
                                        }
                                        // 以json形式，把操作结果返回给前台页面
                                        // 释放连接
                                        connection.release();
                                    });
                                } else {
                                    connection.query(userSQL.putBotState, list, function (err, result) {
                                        if (!!result) {
                                            result = {
                                                status: 0,
                                                msg: '修改成功'
                                            };
                                            responseJSON(res, result);
                                        } else {
                                            result = {
                                                status: -1,
                                                msg: '操作失败,未知处理异常'
                                            };
                                            responseJSON(res, result);
                                        }
                                        // 以json形式，把操作结果返回给前台页面
                                        // 释放连接
                                        connection.release();
                                    });
                                }
                            });
                        } else {// 建立连接执行SQ
                            connection.query(userSQL.insertHold, listHold, function (err, result) {
                                connection.query(userSQL.insertHold2, listHold, function (err, result) {
                                    if (!!result) {
                                        connection.query(userSQL.queryBot, [userResult[0].user_account], function (err, result) {
                                            if (result.length <= 0) {
                                                connection.query(userSQL.insertBotState, list, function (err, result) {
                                                    if (!!result) {
                                                        result = {
                                                            status: 0,
                                                            msg: '修改成功'
                                                        };
                                                        responseJSON(res, result);
                                                    } else {
                                                        result = {
                                                            status: -1,
                                                            msg: '操作失败,未知处理异常'
                                                        };
                                                        responseJSON(res, result);
                                                    }
                                                    // 以json形式，把操作结果返回给前台页面
                                                    // 释放连接
                                                    connection.release();
                                                });
                                            } else {
                                                connection.query(userSQL.putBotState, list, function (err, result) {
                                                    if (!!result) {
                                                        result = {
                                                            status: 0,
                                                            msg: '修改成功'
                                                        };
                                                        responseJSON(res, result);
                                                    } else {
                                                        result = {
                                                            status: -1,
                                                            msg: '操作失败,未知处理异常'
                                                        };
                                                        responseJSON(res, result);
                                                    }
                                                    // 以json形式，把操作结果返回给前台页面
                                                    // 释放连接
                                                    connection.release();
                                                });
                                            }
                                        });
                                    } else {
                                        result = {
                                            status: -1,
                                            msg: '操作失败,未知处理异常'
                                        };
                                        responseJSON(res, result);
                                        connection.release();
                                    }
                                    // 以json形式，把操作结果返回给前台页面
                                    // 释放连接
                                });
                            });
                        }
                    });
                }
            }
        });
    })
});


// 获取机器人状态
router.get('/getBot/state', function (req, res, next) {
    // 从连接池获取连接
    let account = req.query.account;
    if (!account) {
        let result = {
            status: -1,
            msg: '操作失败,数据格式有误'
        };
        responseJSON(res, result);
        return;
    }
    pool.getConnection(function (err, connection, next) {
        // 建立连接执行SQL
        connection.query(userSQL.queryBot, [account], function (err, result) {
            if (!!result && result.length > 0) {
                result = {
                    status: 0,
                    msg: '查询成功',
                    data: result[0]
                };
                connection.release();
                responseJSON(res, result);
            } else {
                result = {
                    status: 0,
                    data: {
                        "user_account": account,
                        "created": "",
                        "level": "-",
                        "new_position_qty": "0",
                        "bot_nanpin": "0",
                        "max_position_qty": "0",
                        "nanpin_count": "0",
                        "status": "未启动"
                    },
                    msg: '未获取到任何数据'
                };
                connection.release();
                responseJSON(res, result);
            }
        });
    });
});

// 获取用户群体
router.get('/getBotList', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection, next) {
        // 建立连接执行SQL
        connection.query(userSQL.getBotList, function (err, result) {
            if (!!result && result.length > 0) {
                result = {
                    status: 0,
                    msg: '查询成功',
                    data: result
                };
                responseJSON(res, result);
            } else {
                result = {
                    status: 0,
                    msg: '查询成功',
                    data: []
                };
                responseJSON(res, result);
            }
            // 以json形式，把操作结果返回给前台页面
            // 释放连接
            connection.release();
        });
    });
});

// 获取监控中心数据
router.get('/getBotState/:state', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection, next) {
        // 建立连接执行SQL
        let sql = userSQL.getBotStateList;
        if (req.params.state == 'empty') {
            sql = userSQL.getBotEmptyList;
        }
        connection.query(sql, function (err, result) {
            if (!!result && result.length > 0) {
                connection.release();
                fetch('https://www.bitmex.com/api/v1/trade?count=200&reverse=true&symbol=XBTUSD', {
                    method: 'GET'
                }).then(data => {
                    data.json().then(function (json) {
                        let results = {
                            status: 0,
                            msg: '查询成功',
                            price: json[0].price,
                            // price: 1,
                            data: result
                        };
                        responseJSON(res, results);
                    })
                })
            } else {
                let results = {
                    status: 0,
                    msg: '查询成功',
                    price: 1,
                    data: []
                };
                connection.release();
                responseJSON(res, results);
            }
            // 以json形式，把操作结果返回给前台页面
            // 释放连接
        });
    });
});

router.get('/getBitMexPrice', function (req, res, next) {
    // 从连接池获取连接
    fetch('https://www.bitmex.com/api/v1/trade?count=200&reverse=true&symbol=XBTUSD', {
        method: 'GET'
    }).then(data => {
        data.json().then(function (json) {
            let results = {
                status: 0,
                msg: '查询成功',
                price: json[0].price,
                time: new Date()
            };
            responseJSON(res, results);
        })
    })
});


// 获取异常机器人
router.get('/getBotWarning/:type', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection, next) {
        // 建立连接执行SQL
        let data = new Date();
        data.setHours(data.getHours() - 2);
        let createTime = moment(data).format('YYYY-MM-DD HH:mm:ss');
        let sql = userSQL.getBotNotStart;
        if (req.params.type == 'time') {
            sql = userSQL.getBotWarning
        }
        connection.query(sql, [createTime], function (err, result) {
            if (!!result && result.length > 0) {
                result = {
                    status: 0,
                    msg: '查询成功',
                    data: result
                };
                responseJSON(res, result);
            } else {
                result = {
                    status: 0,
                    msg: '查询成功',
                    data: []
                };
                responseJSON(res, result);
            }
            // 以json形式，把操作结果返回给前台页面
            // 释放连接
            connection.release();
        });
    });
});

// 初始化取机器人状态
router.post('/insertBotInit', function (req, res, next) {
    // 从连接池获取连接
    let param = req.body || req.params;
    pool.getConnection(function (err, connection, next) {
        // 建立连接执行SQL
        connection.query(userSQL.insertBot, [param.account], function (err, result) {
            if (!!result) {
                result = {
                    status: 0,
                    msg: '初始化设置成功',
                    data: result[0]
                };
                responseJSON(res, result);
            } else {
                result = {
                    status: 0,
                    data: {},
                    msg: '初始化设置失败'
                };
                responseJSON(res, result);
            }
            // 以json形式，把操作结果返回给前台页面
            // 释放连接
            connection.release();
        });
    });
});

// 获取持仓状态
router.get('/getRecord', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection, next) {
        // 建立连接执行SQL
        connection.query(userSQL.getRecord, [req.query.account], function (err, result) {
            if (!!result && result.length > 0) {
                result = {
                    status: 0,
                    msg: '查询成功',
                    data: result[0]
                };
                responseJSON(res, result);
            } else {
                result = {
                    status: 0,
                    data: {
                        "user_account": req.query.account,
                        bot_avgEntryPrice: "0.00",
                        bot_balance: "0",
                        bot_liquidationPrice: "0",
                        bot_mex_last: "0.00",
                        bot_set_time: "",
                        bot_side: "未获取到数据",
                        bot_size: "0",
                        bot_warn_state: "0",
                        bot_warn_txt: "",
                        type: 0
                    },
                    msg: '未获取到任何数据'
                };
                responseJSON(res, result);
            }
            // 以json形式，把操作结果返回给前台页面
            // 释放连接
            connection.release();
        });
    });
});

// 获取全部持仓状态
router.get('/getRecordAll', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection, next) {
        // 建立连接执行SQL
        connection.query(userSQL.getRecordAll, [req.query.account], function (err, result) {
            if (!!result && result.length > 0) {
                result.forEach(function (item, index) {
                    let time = new Date(item.bot_set_time).getTime();//转换成毫秒
                    item.bot_set_time = time
                })
                result = {
                    status: 0,
                    msg: '查询成功',
                    data: result
                };
                responseJSON(res, result);
            } else {
                result = {
                    status: 0,
                    data: [],
                    msg: '未获取到任何数据'
                };
                responseJSON(res, result);
            }
            // 以json形式，把操作结果返回给前台页面
            // 释放连接
            connection.release();
        });
    });
});

// 获取可提现账户余额
router.get('/getPutBalance', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection, next) {
        // 建立连接执行SQL
        connection.query(userSQL.getPutBalance, [req.query.account], function (err, result) {
            if (!!result && result.length > 0) {
                result.forEach(function (item, index) {
                    let time = new Date(item.bot_set_time).getTime();//转换成毫秒
                    item.bot_set_time = time
                })
                result = {
                    status: 0,
                    msg: '查询成功',
                    data: result
                };
                responseJSON(res, result);
            } else {
                result = {
                    status: 0,
                    data: [],
                    msg: '未获取到任何数据'
                };
                responseJSON(res, result);
            }
            // 以json形式，把操作结果返回给前台页面
            // 释放连接
            connection.release();
        });
    });
});

// 获取盈利分红记录
router.get('/getRecordProfit', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection, next) {
        // 建立连接执行SQL
        connection.query(userSQL.getRecordData2, [req.query.account, (parseInt(req.query.pageIndex) - 1) * parseInt(req.query.pageSize), parseInt(req.query.pageSize)], function (err, result) {
            connection.query(userSQL.getRecordCount2, [req.query.account], function (err, resultCount) {
                if (!!result && result.length > 0) {
                    result.forEach(function (item, index) {
                        let time = new Date(item.bot_set_time).getTime();//转换成毫秒
                        item.bot_set_time = time
                    })
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
                        data: [],
                        count: 0,
                        msg: '未获取到任何数据'
                    };
                    responseJSON(res, result);
                }
                // 以json形式，把操作结果返回给前台页面
                // 释放连接
                connection.release();
            });
        });
    });
});
// 获取邀请分红记录
router.get('/getRecordInvite', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection, next) {
        // 建立连接执行SQL
        connection.query(userSQL.getRecordData1, [req.query.account, (parseInt(req.query.pageIndex) - 1) * parseInt(req.query.pageSize), parseInt(req.query.pageSize)], function (err, result) {
            connection.query(userSQL.getRecordCount1, [req.query.account], function (err, resultCount) {
                if (!!result && result.length > 0) {
                    result.forEach(function (item, index) {
                        let time = new Date(item.bot_set_time).getTime();//转换成毫秒
                        item.bot_set_time = time
                    })
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
                        data: [],
                        count: 0,
                        msg: '未获取到任何数据'
                    };
                    responseJSON(res, result);
                }
                // 以json形式，把操作结果返回给前台页面
                // 释放连接
                connection.release();
            });
        });
    });
});

// 发起提现申请
router.post('/setPut', function (req, res, next) {
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
        let list = [
            new Date().getTime(),//创建时间
            param.num,//提现金额
            param.account,//申请用户帐号
            param.address,//申请用户帐号
            param.uuid,//申请用户UUID
            0//提现记录状态
        ]
        list[0] = moment(parseInt(list[0])).format('YYYY-MM-DD HH:mm:ss');
        // 建立连接执行SQL
        connection.query(userSQL.getPutType, [0, 0, 100], function (err, result) {
            if (!!result && result.length > 0) {
                result = {
                    status: -200,
                    msg: '提交失败,您有正在处理的提现申请!'
                };
                responseJSON(res, result);
                connection.release();
            } else {
                connection.query(userSQL.insertPutData, list, function (err, result) {
                    if (!!result) {
                        result = {
                            status: 0,
                            msg: '提交成功'
                        };
                        responseJSON(res, result);
                    } else {
                        result = {
                            status: -1,
                            msg: '提交失败,未知处理异常'
                        };
                        responseJSON(res, result);
                    }
                    // 以json形式，把操作结果返回给前台页面
                    // 释放连接
                    connection.release();
                });
            }
        })

    });
});
//所有提现申请列表
router.get('/getPut', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection, next) {
        // 建立连接
        let sql = userSQL.getPutAll,
            list = [(parseInt(req.query.pageIndex) - 1) * parseInt(req.query.pageSize), parseInt(req.query.pageSize)];
        if (!!req.query.type) {
            sql = userSQL.getPutType
            list = [req.query.type, (parseInt(req.query.pageIndex) - 1) * parseInt(req.query.pageSize), parseInt(req.query.pageSize)];
        }
        connection.query(sql, list, function (err, result) {
            if (!!result) {
                connection.query(userSQL.getPutCount, function (err, resultCount) {
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

//用户个人提现记录列表
router.post('/getUserPut', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection, next) {
        var param = req.body || req.params;
        // 建立连接
        connection.query(userSQL.getPutUser, [param.account, param.uuid, (parseInt(param.pageIndex) - 1) * parseInt(param.pageSize), parseInt(param.pageSize)], function (err, result) {
            if (!!result) {
                connection.query(userSQL.getPutUserCount, [param.account, param.uuid], function (err, resultCount) {
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

//提现审核
router.put('/setUserPutType', function (req, res, next) {
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
        connection.query(userSQL.setUserPutType, [param.type, param.desc, param.account, param.uuid, param.id], function (err, result) {
            if (!!result && param.type != 2) {
                let listHold = [
                    param.account || '',//用户
                    '',//余额
                    '-' + param.num,//资金变动值
                    '提现',//持仓方向
                    '',//持仓数量
                    '',//持仓均价
                    '',//爆仓点位
                    '',//当前最新价格
                    time,               //数据写入时间
                    0 || '',//数据状态  是否有警告
                    '成功提现',//数据警告内容
                    5, //数据类型: 0 盈利数据   1 邀请分红数据  2 团队分红数据 3提现数据  4上级分佣抽成  5成功提现
                    0
                ]
                connection.query(userSQL.insertHold, listHold, function (err, result) {
                    result = {
                        status: 0,
                        msg: '修改成功'
                    };
                    let list = [
                        9,
                        time,
                        '确认来自' + param.account + '提现申请,提现金额' + param.num + '。'
                    ]
                    addLogsFn(connection, list, function () {
                        responseJSON(res, result);
                        connection.release();
                    });
                });
            } else if (!!result) {
                result = {
                    status: 0,
                    msg: '修改成功'
                };

                let list = [
                    9,
                    time,
                    '拒绝来自' + param.account + '提现申请,提现金额' + param.num + '。'
                ]
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

// 获取用户团队分红贡献统计
router.get('/getABonusCount/:account', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
// 获取前台页面传过来的参数
        connection.query(userSQL.getABonusCount, [req.params.account], function (err, result) {
            if (!!result) {
                result = {
                    status: 0,
                    msg: '查询成功',
                    data: result[0]
                };
            } else {
                result = {
                    status: 0,
                    msg: '查询失败，没有数据',
                    data: {count: 0}
                };
            }
            responseJSON(res, result);
//             // 释放连接
            connection.release();
        });
    });
});

// 获取用资金记录
router.get('/getaccreclist/:account/:pageIndex/:pageSize', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
// 获取前台页面传过来的参数
        let startNum = ((parseInt(req.params.pageIndex) - 1) * parseInt(req.params.pageSize)) > 0 ? ((parseInt(req.params.pageIndex) - 1) * parseInt(req.params.pageSize) - (parseInt(req.params.pageIndex) - 1)) : 0;
        connection.query(userSQL.getAccRecordList, [req.params.account, startNum, parseInt(req.params.pageSize)], function (err, result) {
            connection.query(userSQL.getAccRecordListCount, [req.params.account], function (err, resultCount) {
                if (!!result) {
                    result = {
                        status: 0,
                        msg: '查询成功',
                        data: result,
                        count: resultCount[0].count
                    };
                } else {
                    result = {
                        status: 0,
                        msg: '查询失败，没有数据',
                        data: {count: 0},
                        count: 0
                    };
                }
                responseJSON(res, result);
//             // 释放连接
                connection.release();
            });
        });
    });
});
// 获取用户资金走势  绘制折线图
router.get('/getaccrecchart/:account/:limit', function (req, res, next) {
    // 从连接池获取连接
    pool.getConnection(function (err, connection) {
// 获取前台页面传过来的参数
        connection.query(userSQL.getAccRecordChart, [req.params.account, parseInt(req.params.limit)], function (err, result) {
            if (!!result) {
                result = {
                    status: 0,
                    msg: '查询成功',
                    data: result
                };
            } else {
                result = {
                    status: 0,
                    msg: '查询失败，没有数据',
                    data: {count: 0}
                };
            }
            responseJSON(res, result);
//             // 释放连接
            connection.release();
        });
    });
});

//自动执行事件-超时关闭机器人
schedule.scheduleJob('30 1 1 * * *', function () {
// schedule.scheduleJob('30 * * * * *', function(){
    pool.getConnection(function (err, connection) {
        let time = new Date().getTime()
        let EndTime = moment(time).format('YYYY-MM-DD HH:mm:ss');
        connection.query(userSQL.getUserOutTime, [EndTime], function (err, result) {
            if (!!result && result.length > 0) {
                let str = '';
                for (let i in result) {
                    str += "'" + result[i].account + "'";
                    if (i < result.length - 1) {
                        str += ','
                    }
                }
                offBotFn(connection, str, function () {
                    let list = [
                        7,
                        EndTime,
                        '会员服务到期:已关闭(' + str + ')的机器人'
                    ]
                    addLogsFn(connection, list, function () {
                        connection.release();
                    });
                })
            } else {
                connection.release();
            }
        });
    })
});


//自动执行事件-检查会员晋级
schedule.scheduleJob('30 1 2 * * *', function () {
//    router.get('/getAllUserPay', function (req, res, next) {
    console.log('会员自动晋级');
    pool.getConnection(function (err, connection) {
        connection.query(userSQL.getAllUserPay, function (err, resultMaxUser) {//先查询所有数据
            //循环遍历所有用户
            if (resultMaxUser.length > 0) {
                async.map(resultMaxUser, function (item, callback) {
                    let obj = {
                        id: item.id,
                        account: item.account,
                        nowLevel: item.level,
                        direct: 0,
                        teamLevel: 0,
                        teamPay: 0
                    };
                    //查询付费直推
                    connection.query(userSQL.getInDirectPay, [item.Invitcode], function (err, resultCertainUser) {
                        if (resultCertainUser.length > 0) {
                            obj.direct = resultCertainUser.length;
                            resultCertainUser.forEach((items, index2) => {//记录升级需要的同等级成员
                                let certain = items;
                                if (certain.teamlevel >= item.level) {
                                    obj.teamLevel += 1;
                                }
                            });
                            //递归统计下级团队付费用户
                            countPayNumFn(connection, item.Invitcode, obj, 0, function (rest) {
                                // console.log(rest);
                                callback(null, rest);
                            });
                        } else {
                            callback(null, obj);
                        }
                    });
                }, function (err, results) {
                    let updateList = [];
                    let whereSql = '';
                    let whereSql2 = '';
                    let idSql = [];
                    let accountSql = [];
                    results.forEach((item, index) => {
                        let obj = {
                            account: item.account,
                            level: -1,
                            txt: '新手'
                        };

                        switch (item.nowLevel) {
                            case '-1'://普通用户
                                if (item.direct >= 3 && item.teamPay >= 11) {
                                    obj.level = 0;
                                    obj.txt = '新手';
                                    updateList.push(obj);
                                    idSql.push(item.id);
                                    accountSql.push(item.account);
                                    whereSql += 'WHEN ' + item.id + ' THEN 0 ';
                                    whereSql2 += 'WHEN \'' + item.account + '\' THEN 0 ';
                                }
                                break;
                            case '0'://新手
                                if (item.direct >= 5 && item.teamPay >= 35 && item.teamLevel >= 3) {
                                    obj.level = 1;
                                    obj.txt = '高手';
                                    updateList.push(obj);
                                    idSql.push(item.id);
                                    accountSql.push(item.account);
                                    whereSql += 'WHEN ' + item.id + ' THEN 1 ';
                                    whereSql2 += 'WHEN \'' + item.account + '\' THEN 1 ';
                                }
                                break;
                            case '1'://高手
                                if (item.direct >= 7 && item.teamPay >= 125 && item.teamLevel >= 3) {
                                    obj.level = 2;
                                    obj.txt = '大师';
                                    updateList.push(obj);
                                    idSql.push(item.id);
                                    accountSql.push(item.account);
                                    whereSql += 'WHEN ' + item.id + ' THEN 2 ';
                                    whereSql2 += 'WHEN \'' + item.account + '\' THEN 2 ';
                                }
                                break;
                            case '2'://大师
                                if (item.direct >= 10 && item.teamPay >= 400 && item.teamLevel >= 3) {
                                    obj.level = 3;
                                    obj.txt = '传奇';
                                    updateList.push(obj);
                                    idSql.push(item.id);
                                    accountSql.push(item.account);
                                    whereSql += 'WHEN ' + item.id + ' THEN 3 ';
                                    whereSql2 += 'WHEN \'' + item.account + '\' THEN 3 ';
                                }
                                break;
                        }
                    });
                    if (idSql.length > 0) {
                        connection.query('UPDATE users SET `level` = CASE id ' + whereSql + ' END WHERE id IN (?)', [idSql], function (err, resultSetUser) {
                            connection.query('UPDATE invitation SET teamlevel = CASE account ' + whereSql2 + ' END WHERE account IN (?)', [accountSql], function (err, resultSetId) {
                                let time = new Date().getTime();
                                let EndTime = moment(time).format('YYYY-MM-DD HH:mm:ss');
                                if (!!err) {
                                    console.log(err);
                                    let logList = [404, EndTime, '会员自动晋级处理异常'];
                                    addLogsFn(connection, logList, function () {
                                        responseJSON(res, true);
                                        connection.release();
                                    });
                                } else {
                                    let txt = '';
                                    updateList.forEach((items, index2) => {
                                        txt += '会员' + items.account + '已经晋级为' + items.txt + ';'
                                    });
                                    let logList = [8, EndTime, '会员自动晋级机制启动：' + txt];
                                    addLogsFn(connection, logList, function () {
                                        responseJSON(res, true);
                                        connection.release();
                                    });
                                }

                            })
                        })
                    } else {
                        connection.release();
                    }
                });
            } else {
                connection.release();
            }
        });
    })
});

//统计付费会员递归
function countPayNumFn(connection, code, data, index, callback) {
    query(connection, code, function (result) {
        let length = result.length;
        if (length > 0) {
            result.forEach((item, indexs) => {
                if (item.type == 2) {
                    data.teamPay += 1;
                }
                countPayNumFn(connection, item.Invitcode, data, index, function (rest) {
                    length--;
                    if (length <= 0) {
                        callback(rest);
                    }
                })
            })
        } else {
            callback(data);
        }
    })
}


// 关闭机器人公共方法

function offBotFn(connection, list, callback) {
    // pool.getConnection(function (err, connection) {
    console.log('发起关闭' + list + '的机器人');
    // connection.query('SELECT * FROM robot_parameter WHERE user_account in ('+ list +') AND open = 1', function (err, result) {
    //     if(result.length > 0){
    console.log('关闭机器人中:');
    connection.query('UPDATE robot_parameter SET open = 0 WHERE user_account in (' + list + ')', function (err, result) {
        callback(result)
    });
}


// 写入日志的公共方法
function addLogsFn(connection, list, callback) {
    connection.query(userSQL.addLogs, list, function (err, result) {
        callback(result)
    });
}


module.exports = router;



