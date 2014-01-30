function connect(callback) {

    var orm = require('orm');
    var credits = {
        protocol: 'mysql',
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'nodeserials'
    };

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
            //time to define models
            var models = require('./models.js')(db);
            //this is NOT async, so no callback required here
            //models defined, queries can be done now
            if (callback) callback(db);

        }

    });
}

exports.connect = connect;

