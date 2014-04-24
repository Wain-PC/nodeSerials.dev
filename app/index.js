var express = require('express');
var app = express();


//jade enable
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');


//use logger in development mode
//app.use(express.logger('dev'));
//use router
app.use(app.router);

//db connection and models
app.set('models', require('./database/models'));

//set config
app.set('config', require('./core/config'));

//set deferred request queue
var Q = require('./core/queue');
Q = new Q(app);
Q.setMaxListeners(100);
//Q.startDynamicRequestExecution();

app.set('queue', Q);

//routing
require('./routes.js')(app);
require('./core/frontend')(app);

//after all, handle 404 error
console.log("404 listener add");
app.all("*", function (request, response) {
    response.statusCode = 404;
    response.end("Page not found");
});

app.listen(1337);