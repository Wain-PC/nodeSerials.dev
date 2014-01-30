/**
 * Created with JetBrains WebStorm.
 * User: wain-_000
 * Date: 23.01.14
 * Time: 21:48
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');
var util = require('util');

module.exports = function (app, db) {

    var modulesFolder = 'modules';
    //modules routing
    app.get("/", function (request, response) {
        response.end("Welcome to the homepage!");
    });

    //syncronous directory searching of available modules
    fs.readdirSync(__dirname + '/' + modulesFolder).forEach(function (file) {
        console.log("GOT " + file);
        //implying each directory is a valid module here
        var stat = fs.statSync(__dirname + '/' + modulesFolder + '/' + file);
        if (stat && stat.isDirectory()) {
            console.log("Loading module " + file);
            require('./' + modulesFolder + '/' + file)(app, db);
        }


        /*
         if (file === "index.js" || file.substr(file.lastIndexOf('.') + 1) !== 'js')
         return;
         var name = file.substr(0, file.indexOf('.'));
         */

    });
};