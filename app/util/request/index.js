/**
 * Created with JetBrains WebStorm.
 * User: wain-_000
 * Date: 22.01.14
 * Time: 22:49
 * To change this template use File | Settings | File Templates.
 */
var QS = require('querystring');
var REQUEST = require('request');
var merge = require('../merge');

function Request(userAgent, type) {
    this.USER_AGENT = userAgent;
    this.TYPE = type;
}

Request.prototype.makeRequest = function (url, data, callback, params) {
    var _this = this;
    var USER_AGENT = _this.USER_AGENT;
    var requestOptions = {
        headers: {
            'User-Agent': USER_AGENT
        },
        method: 'GET',
        followRedirect: true,
        followAllRedirects: true
    };
    var type = _this.TYPE;

    //allow merging for options
    requestOptions.merge = merge;

    switch (type) {
        case 'GET':
        case 'POST':
        {
            requestOptions.merge({
                    url: url,
                    method: type}
            );
            break;
        }
        default:
        {
            //throw new Error("Wrong request type specified");
            console.log("Wrong request type specified");
            callback(false, false, false);
        }
    }

    if (data) {

        if (type = "GET") {
            requestOptions.merge({qs: data});
        }

        else if (type = "POST") {
            requestOptions.merge({data: QS.stringify(data)});
        }

    }

    if (params) {
        requestOptions.merge(params);
    }

    var onRequestFinished = function (error, response, body) {
        if (error) {
            console.log("Request error:" + error);
        }

        //console.log("Got status code: " + response.statusCode);
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

    console.log('Sending ' + type + ' request to: ' + url + JSON.stringify(requestOptions));
    REQUEST(requestOptions, onRequestFinished);

};

//exporting function
module.exports = Request;