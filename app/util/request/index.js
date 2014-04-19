/**
 * Created with JetBrains WebStorm.
 * User: wain-_000
 * Date: 22.01.14
 * Time: 22:49
 * To change this template use File | Settings | File Templates.
 */
var QS = require('querystring');
var REQUEST = require('request');
var EVENTS = require('events');
var merge = require('../merge');

function Request(app, userAgent, type) {
    this.USER_AGENT = userAgent;
    this.TYPE = type;
    this.app = app;
    this.Q = app.get('queue');

    //generating requestId (should be pretty unique)
    var crypto = require('crypto');
    var sha = crypto.createHash('sha1');
    var buf = crypto.pseudoRandomBytes(128);
        sha.update(buf);

    this.requestId = sha.digest('hex');
    console.log("RequestID:"+this.requestId);
}

Request.prototype = new EVENTS.EventEmitter;

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

   console.log('Sending ' + type + ' request to: ' + url + JSON.stringify(requestOptions));
    REQUEST(requestOptions, function (error, response, body) {
        _this._onResponse(error, response, body, callback);
    });
};


Request.prototype._onResponse = function (error, response, body, callback) {
    if (error) {
        console.log("Request error:" + error);
        if (callback) {
            callback(error, response, body);
        }
        this.emit('fail', error, response, body);
        return false;
    }

    console.log("Got status code: " + response.statusCode);
    console.log("Got headers: " + JSON.stringify(response.headers));
    if (response.statusCode != 200) {
        console.log("Request error, code " + response.statusCode);
        this.emit('fail', error, response, body);
        return false;
    }
    console.log("Got body: " + body);
    this.emit('success', error, response, body);
    if (callback) {
        callback(error, response, body);
    }
    return true;
};


Request.prototype.makeDeferredRequest = function (url, data, callback) {
    var _this = this;
    console.log("DATA:"+data);
    _this.Q.push({
        url: url,
        requestId: _this.requestId,
        type: _this.TYPE,
        userAgent: _this.USER_AGENT,
        params: data
    }, function (item) {
        console.log("Item is in the queue now!");
        //we should listen to the unique identifier generated for this request
        //who emits the 'request ready' event?
        _this.Q.on('done',function(requestId,error,response,body){
            //check where it's really our request, not someone else'
            console.log("Some request done: "+requestId);
            if(requestId == _this.requestId) {
                console.log("YEAH, this is mine!");
              _this.Q.removeAllListeners('done');
                _this._onResponse(error,response,body);
            }
        });
        console.log("Event listener set with eventId "+_this.requestId);
        callback(item);
    });
};


//exporting function
module.exports = Request;