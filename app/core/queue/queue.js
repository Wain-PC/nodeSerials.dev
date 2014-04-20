var Queue = function (app) {
    this.app = app;

    this.rrx = app.get('config');
    this.rrx = this.rrx.rrx;

    this.rrxIntervalHandler = null;

    this.queue = app.get("models");
    this.queue = this.queue.Queue;

    this.status = {
        new: 'new',
        sent: 'sent'
    };
};

var EVENTS = require('events');
Queue.prototype = new EVENTS.EventEmitter;


//this is a VERY EARLY prototype of what it should be
//it doesn't actually do any 'send-to-device' stuff
Queue.prototype.remoteRequestExecutor = function() {
    var _this = this;
    var Request = require('../../util/request');

    _this.pull(function(item) {
        if(!item.id) {
            console.log("Seems like empty queue, RRX aborted.");
            return false;
        }

        var request = new Request(_this.app, item.userAgent, item.type);
        console.log("----------RRX working for request "+item.requestId);
        request.makeRequest(item.url,item.params, function(error,response,body) {
            console.log("Emit done for request "+item.requestId);
            _this.emit('done',item.requestId,error,response,body);
        });
    });

};


Queue.prototype.startDynamicRequestExecution = function() {
    var cqTimeout = this.rrx.timeout.checkQueue;
    var _this = this;
    console.log("RRX started! Interval is set to %d sec",cqTimeout);
    this.rrx.intervalHandler = setInterval(function() {
        _this.remoteRequestExecutor();
    },cqTimeout*1000);
};


Queue.prototype.stopDynamicRequestExecution = function() {
    //I assume it's impossible to check correct execution of the code below.
    //This method is extremely prone to error
    var t = this.rrxIntervalHandler;
    clearInterval(t);
    return true;
};


//push the item to the end of the queue
Queue.prototype.push = function (obj, callback) {
    var _this = this;
    this.queue.create(
        {
            url: obj.url,
            type: obj.type,
            userAgent: obj.userAgent,
            params: JSON.stringify(obj.params),
            status: _this.status.new,
            requestId: obj.requestId
        }
    ).success(function (item) {
            //something to do when the item has been added
            if (callback) callback(item);
        });
};

//pull the first item of the queue
Queue.prototype.pull = function (callback) {
    var _this = this;
    this.queue.find(
        {
            where: {status: _this.status.new},
            order: 'id DESC',
            limit: 1
        }
    ).success(function (item) {
            //okay, now check the item as 'sent' to device for execution
            //if it exists, ofk
            if (!item) {
                callback({});
                return false;
            }
            item.status = _this.status.sent;
            item.save().success(function () {
                // now i'm updated
                //get the params back to object from string
                item.params = JSON.parse(item.params);
                callback(item);
            });
        })
};

//currently, returned answers aren't really detailed. Probably, should return object with error descriptions?
Queue.prototype.rrxResponseReceived = function(query) {
    var status = {
        ok: 'ok',
        fail: 'fail'
        },
        _this = this;

    if(!query) return status.fail;

    try {
        //should we check requestId for presence in our DB?

        var response = {
            headers: query.response.headers,
            statusCode: query.response.statusCode
        };

        _this.emit('done',query.requestId,false,response,query.body);
        return status.ok;

    }
    catch (e) {
        return status.fail;
    }

};


Queue.prototype.resetItemById = function (id, callback) {
    var _this = this;
    this.queue.find(
        {
            where: {id: id}
        }
    ).success(function (item) {
            _this.resetItem(item);
        });
};


Queue.prototype.resetItem = function (item, callback) {
    var _this = this;
    item.status = this.status.new;
    item.save().success(function () {
        // now i'm updated
        callback(item);
    });
};


Queue.prototype.removeItemByRequestId = function (id, callback) {
    var _this = this;
    this.queue.find(
        {
            where: {requestId: id}
        }
    ).success(function (item) {
            item.destroy().success(function () {
                callback('ok');
            });
        });
}


module.exports = Queue;


