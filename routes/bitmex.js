var express = require('express');
var router = express.Router();
var request = require('request');
const crypto = require('crypto');

var apiKey = "DvUo-If2jIwvivt-zibgTvzW";
var apiSecret = "3YxzeoM2M68Xv1pOsT_hceXqtKTy5MmHSo_FgnQ9A2S7cnNk";

var verb = 'POST',
    path = '/api/v1/order',
    expires = new Date().getTime() + (60 * 1000), // 1 min in the future
    data = {symbol:"XBTUSD",orderQty:1,price:590,ordType:"Limit"};

// 预先计算后体，这样我们就可以确信我们在请求中使用了完全相同的主体。
// 在签名中。如果你不这样做，你可能会得到不同的排序键和吹签名。
var postBody = JSON.stringify(data);

var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex');

var headers = {
    'content-type' : 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
    // https://www.bitmex.com/app/apiKeysUsage for more details.
    'api-expires': expires,
    'api-key': apiKey,
    'api-signature': signature
};

const requestOptions = {
    headers: headers,
    url:'https://testnet.bitmex.com'+path + expires,
    method: verb,
    body: postBody
};


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

router.post('/bitmex/:account', function (req, res, next) {
    request(requestOptions, function (error, response, body) {
        console.log(error);
        if (error) {
            let results = {
                status: -200,
                error:error
            }
            responseJSON(res, results);
        }else {
            let results = {
                status: 0,
                data:body
            }
            console.log(body);
            responseJSON(res, results);
        }
    });
})

module.exports = router;