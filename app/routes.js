/**
 * Created with JetBrains WebStorm.
 * User: wain-_000
 * Date: 23.01.14
 * Time: 21:48
 * To change this template use File | Settings | File Templates.
 */

var fs = require('fs');
var util = require('util');

module.exports = function (app) {

    var modulesFolder = 'modules';
    var modulesList = [];
    //modules routing

    //syncronous directory searching of available modules
    fs.readdirSync(__dirname + '/' + modulesFolder).forEach(function (file) {
        console.log("GOT " + file);
        //implying each directory is a valid module here
        var stat = fs.statSync(__dirname + '/' + modulesFolder + '/' + file);
        if (stat && stat.isDirectory()) {
            console.log("Loading module " + file);
            modulesList.push('modules/' + file + '/');
            require('./' + modulesFolder + '/' + file)(app);
        }
    });

    //add frontend as well
    modulesList.push('/latest');

    app.get("/modules", function (request, response) {
        console.log(JSON.stringify(modulesList));
        response.render('index', {dataArray: modulesList});
    });

};