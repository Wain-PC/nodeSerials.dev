var express = require('express');
var app = express();
var database = require('./database/db.js');
database = new database();


//jade enable
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');


//use logger in development mode
app.use(express.logger('dev'));
//use router
app.use(app.router);

//initializing DB connection
database.connect(function (db) {
    //after we have database connection, start the router
    //it will, in turn, execute each app module
    require('./routes.js')(app, db);

    //after all. handle 404 error
    console.log("404 listener add");
    app.all("*", function (request, response) {
        response.end("Page not found");
    });

    app.listen(1337);
});