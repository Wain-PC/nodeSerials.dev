var server = require('./core/server');
var router = require('./core/router');

//starting the server
server.start(router.route);