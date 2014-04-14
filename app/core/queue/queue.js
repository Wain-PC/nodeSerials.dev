var Queue = function (app) {
    this.queue = app.get("models").Queue;
};

//push the item to the end of the queue
Queue.prototype.push = function (url, params, callback) {
    this.queue.create(
        {
            url: url,
            params: params
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
            limit: 1
        }
    ).success(function (item) {

        })
};


