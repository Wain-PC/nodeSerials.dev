var Database = function () {
    this.credits = {
        protocol: 'mysql',
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'nodeserials'
    };
    this.db = false;

}


Database.prototype.connect = function (callback) {
    var _this = this;
    var orm = require('orm');
    var credits = _this.credits;

    var connectionString = 'mysql://' + credits.user + ':' + credits.password + '@' + credits.host + '/' + credits.database;
    console.log("CONN_STRING:" + connectionString);

    orm.connect(connectionString, function (err, db) {
        if (err) {
            console.log("Something is wrong with the connection", err);
            return false;
        }
        else {
            // db is now available to use! ^__^
            console.log("Database connection established successfully!");
            _this.db = db;
            //time to define models
            //this is NOT async, so no callback required here
            require('./models.js')(db);
            //models defined, queries can be done now
            if (callback) callback(db);
        }
    });
}


Database.prototype.writeSeries = function (series) {
    var _this = this;
    var db = _this.db;
    console.log(db.models);
}.bind(this);

module.exports = Database;

