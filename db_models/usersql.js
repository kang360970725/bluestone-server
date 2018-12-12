var UserSQL = {
    //用户注册
    insert:'INSERT INTO users(uuid,account,password,email,phone,nickname,Invitcode,Invitdcode,createtime) VALUES (LPAD((select max(a.id)+1 from users a), 7, 0),?,?,?,?,?,?,?,?)',//注册
    insertInvit:'INSERT INTO invitation (`uuid`, `account`, `Invitcode`, `Invitdcode`, `indirectcode`, `teamlevel`, `globalpartners`) SELECT u1.uuid,u1.account,u1.Invitcode,u1.Invitdcode,(SELECT u2.Invitdcode FROM users u2 WHERE u2.Invitcode = u1.Invitdcode) as indirectcode,u1.level,u1.globalpartners FROM users u1 WHERE u1.account = ?;',//注册
    insertCode:'INSERT INTO code_verification(code,account,type,endtime) VALUES (?,?,?,?)',
    getEmailCode:'SELECT * FROM code_verification WHERE code = ? AND account = ? AND type = ? AND endtime > ?',
    //用户账户相关
    confirmUser:'SELECT * FROM users WHERE account = ? and password = ?',//登录
    queryUserAll:'SELECT * FROM users u WHERE u.level < 5 order by u.createtime DESC LIMIT ?,?',//查询所有用户
    // getUserOutTime:'SELECT * FROM users u WHERE u.type in (\'1\',\'2\') AND u.endtime < ? AND activation_state = 1',//查询所有即将过期或者已过期用户
    getUserOutTime:'SELECT * FROM users u WHERE u.type in (\'1\',\'2\') AND u.account in (SELECT user_account FROM robot_parameter WHERE `open` = 1) AND u.endtime < ? AND activation_state = 1',//查询所有即将过期或者已过期用户
    queryUserAll1:'SELECT * FROM users u WHERE account LIKE ? AND activation_state = ? AND u.level < 5 order by u.createtime  DESC LIMIT ?,?',//查询所有用户
    queryUserAll1_1:'SELECT * FROM users u WHERE account LIKE ? AND type = ? AND level < 5 order by u.createtime DESC LIMIT ?,?',//查询所有用户
    queryUserAll1_2:'SELECT * FROM users u WHERE type = ? AND activation_state = ? AND level < 5 order by u.createtime DESC LIMIT ?,?',//查询所有用户
    queryUserAll2:'SELECT * FROM users u WHERE type = ? AND u.level < 5 order by u.createtime DESC LIMIT ?,?',//查询所有用户
    queryUserAll2_1:'SELECT * FROM users u WHERE account LIKE ? AND u.level < 5 order by u.createtime DESC LIMIT ?,?',//查询所有用户
    queryUserAll2_2:'SELECT * FROM users u WHERE activation_state = ? AND u.level < 5 order by u.createtime DESC LIMIT ?,?',//查询所有用户
    queryUserAll3:'SELECT * FROM users u WHERE account LIKE ? AND type = ? AND activation_state = ? AND u.level < 5 order by u.createtime DESC LIMIT ?,?',//查询所有用户
    queryUserAll4:'SELECT * FROM users WHERE Invitcode is Null',//查询所有需重置的用户
    queryUserAll5:'SELECT * FROM users WHERE endtime > ? AND endtime < ? LIMIT ?,?',//查询所有即将到期用户
    queryUserAll5_1:'SELECT count(1) as count FROM users WHERE endtime > ? AND endtime < ?',//查询所有即将到期用户数量
    queryUserCount:'SELECT count(1) as count FROM users',//统计用户总数分页用 count
    queryUserCount1:'SELECT count(1) as count FROM users WHERE account LIKE ? AND activation_state = ? AND level < 5',//统计用户总数分页用 count
    queryUserCount1_1:'SELECT count(1) as count FROM users WHERE account LIKE ? AND type = ? AND level < 5',//统计用户总数分页用 count
    queryUserCount1_2:'SELECT count(1) as count FROM users WHERE type = ? AND activation_state = ? AND level < 5',//统计用户总数分页用 count
    queryUserCount2:'SELECT count(1) as count FROM users WHERE type = ? AND level < 5',//统计用户总数分页用 count
    queryUserCount2_1:'SELECT count(1) as count FROM users WHERE account LIKE ? AND level < 5',//统计用户总数分页用 count
    queryUserCount2_2:'SELECT count(1) as count FROM users WHERE activation_state = ? AND level < 5',//统计用户总数分页用 count
    queryUserCount3:'SELECT count(1) as count FROM users WHERE account LIKE ? AND type = ? AND activation_state = ? AND level < 5',//统计用户总数分页用 count
    queryUser:'SELECT * FROM users WHERE account = ? ',//查询用户账号是否存在
    queryUserByUUId:'SELECT * FROM users WHERE uuid = ? ',//查询用户账号是否存在
    queryUserCode:'SELECT * FROM users WHERE Invitcode = ? ',//查询邀请码是否有效
    queryUserByOne:'SELECT * FROM users WHERE account = ? AND uuid = ? ',//查询用户账号是否存在
    editUsers:'UPDATE users SET email=?,phone=?,nickname=?,apikey=?,secret=?,walletaddress=?,wechat=? WHERE account = ? AND uuid = ?',//编辑用户资料
    editUsersAPI:'UPDATE users SET apikey=?,secret=? WHERE account = ?',//设置用户API
    editUsers2:'UPDATE users SET type=?,activation_state=0,starttime=?,endtime=?,bot_type=? WHERE account = ? AND id = ?',//编辑会员有效期
    editUsers2_1:'UPDATE users SET type=?,starttime=?,endtime=?,Invitdcode=? WHERE account = ?',//导入会员有效期
    editUsers3:'UPDATE users SET level=? WHERE account = ? AND uuid = ?',//修改会员等级
    editUsers4:'UPDATE users SET password=?,bot_update=0,Invitcode=? WHERE account = ? AND uuid = ?',//初次登录修改密码
    editUsers4_1:'UPDATE users SET password=? WHERE account = ? AND uuid = ?',//管理员修改密码
    editUsers5:'UPDATE users SET user_principal=?,bonus_base=? WHERE account = ? AND id = ?',//编辑会员本金
    editUsers5_1:'UPDATE users SET bonus_base=?,bot_lirun=? WHERE account = ? AND id = ?',//编辑会员盈利基数
    editUsers5_2:'UPDATE users SET bot_lirun=? WHERE account = ? AND id = ?',//编辑会员盈利基数
    editUsers5_3:'UPDATE users SET bot_lirun=?,bonus_ratio=? WHERE account = ? AND id = ?',//第一次写入会员收取分红的基数点
    editUsers6:'UPDATE users SET popular_user=? WHERE account = ? AND id = ?',//设置热门会员
    editUsers7:'UPDATE users SET activation_state=1,endtime=?,bonus_base=? WHERE account = ? AND id = ?',//激活会员和重置时间
    editUsers8:'UPDATE users SET password=? WHERE account = ? AND password = ?',//会员修改密码
    putUsersByType:'UPDATE users SET type=? WHERE account = ? AND id = ?',//编辑会员类型
    putUsersByGroup:'UPDATE users SET `group` = ? WHERE account in (?)',//编辑会员分组
    putUsersByGlobal:'UPDATE users SET globalpartners=? WHERE account = ? AND id = ?',//编辑会员全球合伙人身份
    queryUsers:'SELECT * FROM users WHERE Invitdcode = ?',//查询邀请会员下线
    queryUsersFather:'SELECT * FROM users WHERE Invitcode = ?',//查询邀请会员上线
    //机器人相关数据操作
    getBot:'SELECT * FROM robot_parameter WHERE user_account = ?',//查询机器人设置信息
    getRecord:'select * from account_record a  WHERE a.user_account = ? AND type = 0 order by a.bot_set_time desc LIMIT 1',//查询当前用户持仓信息
    editBotAPI:'UPDATE robot_parameter SET api=?,secret=? WHERE user_account = ?',//编辑用户机器人设置API
    offBot:'UPDATE robot_parameter SET open = 0 WHERE user_account in (?)',//用户机器人关闭
    putBot: 'UPDATE robot_parameter SET api=?,secret=?,open=?,entry=?,trendfollow=?,mm=?,mmpercent=?,nanpin=?,maxnanpin=?,mmnanpin=?,maxleverage=?,leverage=?,sleep=?,longrange=?,longstop=?,shortrange=?,shortstop=?,losscut=?,time=?,longstopx=?,shortstopx=?,longorder=?,shortorder=?,nanpin_cancel=?,nanpin_order=?,doten=? WHERE user_account = ?',//设置机器人信息
    insertBot: 'INSERT INTO robot_parameter(user_account,open) VALUES (?,0)',//写入机器人设置信息
    insertBot2: 'INSERT INTO `member_platform`.`robot_parameter` (`user_account`, `api`, `secret`, `open`, `entry`, `trendfollow`, `mm`, `mmpercent`, `nanpin`, `maxnanpin`, `mmnanpin`, `maxleverage`, `leverage`, `sleep`, `longrange`, `longstop`, `shortrange`, `shortstop`, `losscut`, `time`, `longstopx`, `shortstopx`, `longorder`, `shortorder`, `nanpin_cancel`, `nanpin_order`, `doten`) VALUES (?, \'\', \'\', \'0\', \'250\', \'1\', \'1\', \'0.0007\', \'250\', \'28\', \'1.25\', \'50\', \'0\', \'40\', \'80\', \'28\', \'80\', \'28\', \'1\', \'5\', \'1999\', \'1999\', \'2\', \'2\', \'0\', \'0\', \'1\');',//写入机器人设置信息
    insertBot3: 'INSERT INTO `member_platform`.`robot_parameter` (`user_account`, `marginLeverage`, `bot_prevDeposited`, `bot_prevWithdrawn`, `bot_amount`, `mmpercent`, `nanpin`, `maxnanpin`, `mmnanpin`, `maxleverage`, `leverage`, `sleep`, `longrange`, `longstop`, `shortrange`, `shortstop`, `losscut`, `time`, `longstopx`, `shortstopx`, `longorder`, `shortorder`, `nanpin_cancel`, `nanpin_order`, `doten`) VALUES (?, \'\', \'\', \'0\', \'250\', \'1\', \'1\', \'0.0007\', \'250\', \'28\', \'1.25\', \'50\', \'0\', \'40\', \'80\', \'28\', \'80\', \'28\', \'1\', \'5\', \'1999\', \'1999\', \'2\', \'2\', \'0\', \'0\', \'1\');',//写入机器人设置信息
    queryBotSimple:'SELECT * FROM robot WHERE user_account = ?',//查询机器人状态
    queryBot:'SELECT b.*, r.shortrange,r.longrange FROM robot b LEFT JOIN (SELECT shortrange,longrange,user_account FROM robot_parameter) AS r ON r.user_account = b.user_account WHERE b.user_account = ?',//查询机器人状态
    insertBotState: 'INSERT INTO robot (created,level,new_position_qty,bot_nanpin,max_position_qty,nanpin_count,status,bot_side,bot_size,bot_avgEntryPrice,bot_liquidationPrice,bot_mex_last,bot_balance,user_account) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',//添加机器人状态信息
    putBotState: 'UPDATE robot SET created=?,level=?,new_position_qty=?,bot_nanpin=?,max_position_qty=?,nanpin_count=?,status=?,bot_side=?,bot_size=?,bot_avgEntryPrice=?,bot_liquidationPrice=?,bot_mex_last=?,bot_balance=? WHERE user_account=?',//修改机器人设置信息
    putBotState1: 'UPDATE robot SET marginLeverage=? WHERE user_account=?',//修改机器人当前杠杆使用情况
    putBotState2: 'UPDATE robot SET bot_prevDeposited=?,bot_prevWithdrawn=?,bot_amount=?,bot_lirun=? WHERE user_account=?',//写入机器人当前账户资金情况(充值,提现,总余额,盈利)
    //写入交易记录
    insertHold: 'INSERT INTO account_record(user_account,bot_balance,bot_change_num,bot_side,bot_size,bot_avgEntryPrice,bot_liquidationPrice,bot_mex_last,bot_set_time,bot_warn_state,bot_warn_txt,type,bonus_base) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);',//添加用户账户资金变动
    insertFenHong: 'INSERT INTO account_record(user_account,bot_balance,bot_change_num,bot_side,bot_size,bot_avgEntryPrice,bot_liquidationPrice,bot_mex_last,bot_set_time,bot_warn_state,bot_warn_txt,type,bonus_base) VALUES ?;',//添加用户分红记录
    insertHold2: 'INSERT INTO account_record_static(user_account,bot_balance,bot_change_num,bot_side,bot_size,bot_avgEntryPrice,bot_liquidationPrice,bot_mex_last,bot_set_time,bot_warn_state,bot_warn_txt,type,bonus_base) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);',//添加用户账户资金变动
    //用户收益相关数据查询
    getRecordAll:'select * from account_record a  WHERE a.user_account = ? order by a.bot_set_time desc',//查询当前用户资金收益统计
    getPutBalance:'select * from account_record a  WHERE a.user_account = ? AND a.type in (\'1\',\'2\',\'5\') order by a.bot_set_time desc',//查询当前用户资金收益统计
    getRecordData1:'select * from account_record a  WHERE a.user_account = ?  AND a.type = \'1\' order by a.bot_set_time desc LIMIT ?,?',//查询当前用户资金收益统计
    getRecordData2:'select * from account_record a  WHERE a.user_account = ?  AND a.type = \'2\' order by a.bot_set_time desc LIMIT ?,?',//查询当前用户资金收益统计
    getRecordCount1:'select count(1) as count from account_record a  WHERE a.user_account = ?  AND a.type = \'1\' order by a.bot_set_time desc',//查询当前用户资金收益统计
    getRecordCount2:'select count(1) as count from account_record a  WHERE a.user_account = ?  AND a.type = \'2\' order by a.bot_set_time desc',//查询当前用户资金收益统计
    //查询邀请会员记录
    //会员开通分红
    getABonusCount:'select sum(bot_change_num) as count from account_record WHERE user_account=? and type in (\'1\',\'2\')',//统计单个用户的团队分红情况

    // getAccRecordList: 'select * , DATE_FORMAT(e.bot_set_time,\'%Y-%m-%d\') as day from (SELECT * FROM account_record WHERE user_account = ? and HOUR(bot_set_time) > 18 and HOUR(bot_set_time) < 24 ORDER BY bot_set_time DESC) e GROUP BY day desc LIMIT ?;',//获取账户交易记录
    getAccRecordList: 'select * , DATE_FORMAT(e.bot_set_time,\'%Y-%m-%d\') as day from (SELECT * FROM account_record WHERE user_account = ? AND type = 0 ORDER BY bot_set_time DESC) e GROUP BY day desc LIMIT ?,?;',//获取账户交易记录
    getAccRecordListCount: 'SELECT count(1) as count from (SELECT DATE_FORMAT(e.bot_set_time,\'%Y-%m-%d\') as day from (SELECT * FROM account_record WHERE user_account = ? AND type = 0 ORDER BY bot_set_time DESC) e GROUP BY day desc) a;',//获取账户交易记录
    getAccRecordChart: 'SELECT * , HOUR(e.bot_set_time) as hour FROM (SELECT * FROM account_record WHERE user_account = ? AND type = 0 ORDER BY bot_set_time DESC) e  GROUP BY HOUR(e.bot_set_time) ORDER BY bot_set_time asc LIMIT ?;',//获取账户过去24小时资金走向

    //token验证
    getTokenCheck: 'SELECT * FROM verification WHERE account = ? and token = ?',//验证token
    getToken: 'SELECT * FROM verification WHERE account = ?',//查询token
    addToken: 'INSERT INTO verification(account,token) VALUES (?,?)',//新增token
    setToken: 'UPDATE verification SET token=? WHERE id=? AND account=?',//修改token
    //申请提现
    insertPutData:'INSERT INTO account_put(create_time,put_num,account,address,uuid,type) VALUES (?,?,?,?,?,?)',//用户提交提现申请资料
    getPutType:'select * from account_put p WHERE type = ? order by p.create_time DESC LIMIT ?,?',//查询用户提现申请
    getPutAll:'select * from account_put p order by p.create_time DESC LIMIT ?,?',//查询用户提现申请
    getPutCount:'SELECT count(1) as count FROM account_put WHERE type = 0',//统计用户提现申请 count
    setUserPutType:'UPDATE account_put SET type=?,`desc`=? WHERE account = ? AND uuid = ? AND id = ?',//处理用户提现申请
    getPutUser:'select * from account_put p WHERE account = ? AND uuid = ? order by p.create_time desc LIMIT ?,?',//查询单个用户提现申请
    getPutUserCount:'SELECT count(1) as count FROM account_put  WHERE account = ? AND uuid = ?',//统计单个用户提现申请 count
    countPutSum:'SELECT SUM(e.put_num) as countPrice FROM account_put e WHERE e.type = 1 ',//统计所有提现金额
    //充值开通
    addRenew: 'INSERT INTO pay_record(account,create_time,type,`desc`,price,data_time) VALUES (?,?,0,?,?,?)',//开通续费记录写入
    getRenew: 'SELECT * FROM pay_record p WHERE p.account = ? order by p.create_time DESC LIMIT 0,100',//会员获取开通续费记录
    putRenew: 'UPDATE pay_record SET credential=?,type=1 WHERE id=? AND account=?',//修改会员开通续费状态
    getRenewAll: 'select * from pay_record p order by p.create_time DESC LIMIT ?,?',//管理员查询所有会员开通续费记录
    getRenewType: 'select * from pay_record p WHERE type = ? order by p.create_time DESC LIMIT ?,?',//条件查询会员开通续费记录
    getRenewCountByType:'SELECT count(1) as count FROM pay_record WHERE type = ?',//查询所有会员开通续费记录 count
    getRenewCount:'SELECT count(1) as count FROM pay_record',//查询所有会员开通续费记录 count
    setRenewType:'UPDATE pay_record SET type=?,`desc`=? WHERE account = ? AND id = ?',//处理用户提现申请
    countRenewSum:'SELECT SUM(e.price) as countPrice FROM pay_record e WHERE e.type = 2 ',//统计所有收益金额
    //分红转账
    addBonus: 'INSERT INTO platform_bonus(account,create_time,price,base,type,`desc`) VALUES (?,?,?,?,0,?)',//平台分红转账记录写入
    getBonus: 'SELECT * FROM platform_bonus p WHERE p.account = ? order by p.create_time DESC LIMIT ?,?',//会员平台分红转账记录
    getBonusCountByUser:'SELECT count(1) as count FROM platform_bonus a  WHERE a.account = ? order by a.create_time desc',//会员平台分红转账记录
    putBonus: 'UPDATE platform_bonus SET credential=?,type=1 WHERE id=? AND account=?',//会员平台分红转账记录
    getBonusAll: 'select * from platform_bonus p order by p.create_time DESC LIMIT ?,?',//查询所有会员平台分红转账
    getBonusType: 'select * from platform_bonus p WHERE type = ? order by p.create_time DESC LIMIT ?,?',//条件查询会员平台分红转账记录
    getBonusCountByType:'SELECT count(1) as count FROM platform_bonus WHERE type = ?',//查询所有会员平台分红转账记录 count
    getBonusCount:'SELECT count(1) as count FROM platform_bonus',//查询所有会员平台分红转账记录 count
    setBonusType:'UPDATE platform_bonus SET type=?,`desc`=? WHERE account = ? AND id = ?',//处理用户提现申请
    countBonusSum:'SELECT SUM(e.price) as countPrice FROM platform_bonus e WHERE e.type = 2 ',//统计所有收益金额
    //日志
    addLogs: 'INSERT INTO logs(type,create_time,`desc`) VALUES (?,?,?)',//添加一个日志
    getLogs: 'SELECT * FROM logs l WHERE l.type = ? order by l.create_time DESC LIMIT ?,?',//分页查询日志
    getLogsCountByType:'SELECT count(1) as count FROM logs WHERE type = ?',//查询日志统计数量 count
    //用户群体
    getBotList: 'SELECT c.*, a.bonus_base,a.user_principal FROM robot c LEFT JOIN (SELECT bonus_base,user_principal,account FROM users) AS a ON a.account = c.user_account order by c.bot_amount DESC ',//查询所有bot
    //查询盈利超出的用户
    offBotUser: 'SELECT new.* FROM (SELECT (u.bot_lirun - u.bonus_base) lirunNum, u.* FROM users u WHERE u.account IN ( SELECT user_account FROM robot_parameter WHERE `open` = 1)) AS new WHERE new.lirunNum > new.bonus_ratio;',//查询所有bot

    //制度查询
    getfenHongUser: 'SELECT * FROM invitation i WHERE i.account = ?;',//查询分红用户的资料信息
    getInUserData: 'SELECT * FROM invitation i WHERE i.Invitcode = ?;',//通过邀请码查询用户
    //制度晋级
    getAllUser: 'SELECT * FROM invitation',//查询分红用户的资料信息-所有处理
    getAllUserPay: 'SELECT * FROM users WHERE type = 2 AND level < 3',//查询分红用户的资料信息-仅仅升级付费用户和等级低于传奇的
    getInDirectPay: 'SELECT * FROM users WHERE Invitdcode = ? AND type = 2;',//通过邀请码查询用户
    upUserLevel: 'UPDATE users SET `level` = CASE id ? END WHERE id IN ?;',//通过邀请码查询用户
    //监控中心
    getBotStateList:'SELECT a.longrange,a.shortrange,a.longstopx,a.shortstopx,a.maxnanpin,u.group,c.* FROM robot c LEFT JOIN (SELECT * FROM robot_parameter) AS a ON a.user_account = c.user_account LEFT JOIN (SELECT * FROM users) AS u ON c.user_account = u.account WHERE bot_side IN (\'SHORT\', \'LONG\') ORDER BY c.marginLeverage DESC',//查询所有的持仓用户
    getBotEmptyList:'SELECT a.longrange,a.shortrange,a.longstopx,a.shortstopx,a.maxnanpin,u.group,c.* FROM robot c LEFT JOIN (SELECT * FROM robot_parameter) AS a ON a.user_account = c.user_account LEFT JOIN (SELECT * FROM users) AS u ON c.user_account = u.account WHERE bot_side NOT IN (\'SHORT\', \'LONG\',\'no\') ORDER BY c.marginLeverage DESC',//查询所有的空仓用户
    addBotLogs: 'INSERT INTO param_logs(operator,create_time,account,record,ip) VALUES (?,?,?,?,?)',//添加一个设置参数机器人的操作日志
    getBotLogs: 'SELECT * FROM param_logs order by create_time DESC LIMIT 0,50',//分页查询日志
    //异常机器人   失联
    // getBotWarning: 'SELECT * FROM robot WHERE `status` not in (\'暂时关闭中\') AND created < ?',//查询所有bot
    getBotWarning: 'SELECT a.uuid,b.token,c.* FROM robot c LEFT JOIN (SELECT * FROM users) AS a ON a.account = c.user_account LEFT JOIN (SELECT * FROM verification) AS b ON a.account = b.account WHERE c.status NOT IN (\'暂时关闭中\') AND c.created < ?',//查询所有bot
    //异常机器人   无法启动
    getBotNotStart: 'SELECT * FROM robot WHERE `status` not in (\'暂时关闭中\',\'建仓指标计算中\') AND bot_side = \'no\'',//查询所有bot
};
module.exports = UserSQL;