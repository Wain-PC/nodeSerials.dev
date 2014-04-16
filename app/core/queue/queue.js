var Queue = function (app) {
    this.queue = app.get("models").Queue;
};

//push the item to the end of the queue
Queue.prototype.push = function (obj, callback) {
    this.queue.create(
        {
            url: obj.url,
            type: obj.type,
            userAgent: obj.userAgent,
            params: obj.params
        }
    ).success(function (item) {
            //something to do when the item has been added
            if (callback) callback(item);
        });
};

//pull the first item of the queue
Queue.prototype.pull = function (id, callback) {
    this.queue.find(
        {
            order: 'id DESC',
            limit: 1
        }
    ).success(function (item) {
            //okay, now remove the item from the database
            item.destroy().success(function () {
                // now i'm gone :)
                callback(item);
            });
        })
};

module.exports = Queue;


