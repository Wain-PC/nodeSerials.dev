var Queue = function (app) {
    this.queue = app.get("models");
    this.queue = this.queue.Queue;
    this.status = {
        new: 'new',
        sent: 'sent'
    };
};

//push the item to the end of the queue
Queue.prototype.push = function (obj, callback) {
    var _this = this;
    this.queue.create(
        {
            url: obj.url,
            type: obj.type,
            userAgent: obj.userAgent,
            params: obj.params,
            status: _this.status.new
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
                callback(item);
            });
        })
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


Queue.prototype.provideDeferredRequestData = function (callback) {
    //pull the item from the queue
    this.pull(function (item) {
        callback(item);
    });
};

module.exports = Queue;


