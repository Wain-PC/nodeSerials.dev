/**
 * Created with JetBrains WebStorm.
 * User: wain-_000
 * Date: 22.01.14
 * Time: 22:49
 * To change this template use File | Settings | File Templates.
 */
var QS = require('querystring');
var NEEDLE = require('needle');

function Request(userAgent, type) {
    this.USER_AGENT = userAgent;
    this.TYPE = type;
}

Request.prototype.makeRequest = function (url, data, callback, params) {
    var _this = this;
    var USER_AGENT = _this.USER_AGENT;
    var requestOptions;
    var type = _this.TYPE;

    switch (type) {
        case 'GET':
        case 'POST':
        {
            break;
        }
        default:
        {
            //throw new Error("Wrong request type specified");
            console.log("Wrong request type specified");
            callback();
        }
    }

    var postRequestData = '';
    if (data) {
        postRequestData = '?' + QS.stringify(data);
    }

    if (params) {
        requestOptions = params;
    }
    else {
        requestOptions = {
            headers: {
                'User-Agent': USER_AGENT
            },
            follow: true
        };
    }

    var onRequestFinished = function (error, response, body) {
        console.log("Got status code: " + response.statusCode);
        //console.log("Got headers: " + JSON.stringify(response.headers));
        if (response.statusCode != 200) {
            console.log("Request error, code " + response.statusCode);
            //throw new Error(response.statusCode);
        }
        //console.log("Got body: " + body);
        if (callback) {
            callback(error, response, body);
        }
    };

    console.log('Sending ' + type + ' request to: ' + url);
    switch (type) {
        case 'GET':
        {
            NEEDLE.get(url + postRequestData, requestOptions, onRequestFinished);
            break;
        }
        case 'POST':
        {
            NEEDLE.post(url + postRequestData, requestOptions, onRequestFinished);
            break;
        }
    }
};

//exporting function
module.exports = Request;