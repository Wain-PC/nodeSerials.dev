/**
 * Created with JetBrains WebStorm.
 * User: wain-_000
 * Date: 22.01.14
 * Time: 22:49
 * To change this template use File | Settings | File Templates.
 */
var QS = require('querystring');
var NEEDLE = require('needle');

function makeRequest(url, type, data, callback) {
    var USER_AGENT = 'Android;HD Serials v.1.7.0;ru-RU;google Nexus 4;SDK 10;v.2.3.3(REL)';

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

    var requestOptions = {
        headers: {
            'User-Agent': USER_AGENT
        }
    };

    var onRequestFinished = function (error, response, body) {
        console.log("Got status code: " + response.statusCode);
//        console.log("Got headers: " + JSON.stringify(response.headers));
        if (response.statusCode != 200) {
            console.log("Request error, code " + response.statusCode);
            return false;
        }
        console.log("Got body: " + JSON.stringify(JSON.parse(body)));
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