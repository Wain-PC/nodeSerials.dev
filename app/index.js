var express = require('express');
var app = express();
var router = require('./routes.js')(app);


//jade enable
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');


//use logger in development mode
app.use(express.logger('dev'));

//404 error
console.log("404 listener add");
app.all("*", function (request, response) {
    response.end("Page not found");
});

app.listen(1337);