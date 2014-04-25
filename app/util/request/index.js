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
    var config = app.get('config');
    this.USER_AGENT = userAgent ? userAgent : config.http.userAgent.desktop.firefox;
    this.TYPE = type ? type : 'GET';
    this.app = app;
    this.Q = app.get('queue');

    //generating requestId (should be pretty unique)
    var crypto = require('crypto');
    var sha = crypto.createHash('sha1');
    var buf = crypto.pseudoRandomBytes(128);
    sha.update(buf);
    this.requestId = sha.digest('hex');
}

Request.prototype = new EVENTS.EventEmitter;

Request.prototype.makeRequest = function (url, data, callback, params) {
    var _this = this;
    var USER_AGENT = _this.USER_AGENT;
    var requestOptions = {
        headers: {
            'User-Agent': USER_AGENT
        },
        method: _this.TYPE,
        followRedirect: true,
        followAllRedirects: true
    };
    var type = _this.TYPE;

    switch (type) {
        case 'GET':
        {
            //in case of GET request, parameters might be provided within the query string.
            //one should extract them (split the string to url string and query object) to store it properly during request execution.
            var re = /^(.*)\?(.*)$/; //this RegExp matches '?' symbol in the URL.
            re = re.exec(url);
            if (re) {
                url = re[1];
                merge.call(data, QS.parse(re[2]));
                console.log(data);
            }

        }
        case 'POST':
        {
            merge.call(requestOptions, {
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
        merge.call(requestOptions, {qs: data});
    }

    if (params) {
        merge.call(requestOptions, params);
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

    //console.log("Got status code: " + response.statusCode);
    //console.log("Got headers: " + JSON.stringify(response.headers));
    if (response.statusCode != 200) {
        console.log("Request error, code " + response.statusCode);
        this.emit('fail', error, response, body);
        if (callback) {
            callback(error, response, body);
        }
        return false;
    }
    //console.log("Got body: " + body);
    this.emit('success', error, response, body);
    if (callback) {
        callback(error, response, body);
    }
    return true;
};


Request.prototype.makeDeferredRequest = function (url, data, callback) {
    var _this = this;
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
        _this.Q.on('done', function (requestId, error, response, body) {
            deferredRequestAnswered(requestId, error, response, body, callback);
        });
        console.log("Event listener set with requestId " + _this.requestId);
    });


    function deferredRequestAnswered(requestId, error, response, body, callback) {
        //check if it's really our request, not someone else's
        if (requestId == _this.requestId) {
            _this.Q.removeListener('done', deferredRequestAnswered);
            console.log("YESH! Mine request! Listener removed.");
            _this.Q.removeItemByRequestId(requestId, function () {
                _this._onResponse(error, response, body, callback);
            });
        }
    }
};


//exporting function
module.exports = Request;