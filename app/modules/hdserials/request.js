/**
 * Created with JetBrains WebStorm.
 * User: wain-_000
 * Date: 22.01.14
 * Time: 22:49
 * To change this template use File | Settings | File Templates.
 */
var QS = require('querystring');
var NEEDLE = require('needle');

function makeRequest(url, data, callback) {
    var USER_AGENT = 'Android;HD Serials v.1.7.0;ru-RU;google Nexus 4;SDK 10;v.2.3.3(REL)';


    var postRequestData = '';
    if (data) {
        postRequestData = '?' + QS.stringify(data);
    }

    var postRequestOptions = {
        headers: {
            'User-Agent': USER_AGENT
        }
    };

    var onRequestFinished = function (error, response, body) {
        console.log("Got status code: " + response.statusCode);
        console.log("Got headers: " + JSON.stringify(response.headers));
        console.log("Got body: " + JSON.stringify(JSON.parse(body)));
        if (callback) {
            callback(error, response, body);
        }
    };

    console.log('Sending request to: ' + url);
    NEEDLE.get(url + postRequestData, postRequestOptions, onRequestFinished);
}

//exporting function
exports.makeRequest = makeRequest;