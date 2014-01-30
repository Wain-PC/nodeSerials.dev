/**
 * Created with JetBrains WebStorm.
 * User: wain-_000
 * Date: 22.01.14
 * Time: 22:49
 * To change this template use File | Settings | File Templates.
 */
var QS = require('querystring');
var NEEDLE = require('needle');

function makeRequest(url, type, data, callback, params) {
    var USER_AGENT = 'Opera/9.80 (Windows NT 6.0) Presto/2.12.388 Version/12.14';
    var requestOptions;

    switch (type) {
        case 'GET':
        case 'POST':
        {
            break;
        }
        default:
        {
            throw new Error("Wrong request type specified");
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
        if (error) {
            throw new Error(error.message);
        }
        console.log("Got status code: " + response.statusCode);
        console.log("Got headers: " + JSON.stringify(response.headers));
        if (response.statusCode != 200) {
            console.log("Request error, code " + response.statusCode);
            console.log("Response body:" + body);
            throw new Error(response.statusCode);
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
}

//exporting function
exports.makeRequest = makeRequest;