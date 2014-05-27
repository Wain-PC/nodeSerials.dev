var request = require('request');

module.exports = function (pattern) {
    return function (req, res, next) {
        if (req.url.match(pattern)) {
            var db_path = req.url.match(pattern)[1];
            console.log("DB_PATH:" + req.protocol + db_path);
            req.pipe(request[req.method.toLowerCase()](db_path)).pipe(res);
        } else {
            next();
        }
    }
};