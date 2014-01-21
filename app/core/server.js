var http = require("http");
var URL = require("url");
var port = 1337;

function start(router) {
  function onRequest(request, response) {
	var pathName = URL.parse(request.url).pathname;
	console.log("Request for " + pathName + " received.");
	//routing
	router(pathName);
	
    response.end();
  }

  http.createServer(onRequest).listen(port);
  console.log("Server has started on port "+port+".");
}

exports.start = start;