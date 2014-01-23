var express = require('express');
var app = express();
var router = require('./routes.js')(app);


//404 error
console.log("404 listener add");
app.all("*", function (request, response) {
    response.end("Page not found");
});

app.listen(1337);