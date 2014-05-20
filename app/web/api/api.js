module.exports = function (app) {

    var Frontend = require("../../core/frontend");
    var providers = require('../../providers');
    var Q = app.get('queue');
    var auth = require('../../core/authentication');
    var f = new Frontend(app);


    //--------API controller
    function show(request, response, res, templateName) {
        //check for JSON
        if (!res || (res.length == 0)) {
            showError(request, response, 404);
            return false;
        }

        var jsonOutput = (request.query.json == 1);
        if (!jsonOutput) {
            response.render(templateName,
                { dataArray: res},
                function (err, html) {
                    if (err) {
                        console.log("Jade error:" + err);
                        response.render('error_general');
                        return false;
                    }
                    response.end(html);
                }
            );
        }
        else {
            response.send(res);
        }
    };

    function showError(request, response, errCode, forceJson) {

        var jsonOutput = ((request.query.json == 1) || (!!forceJson));
        //render as HTML page
        if (!jsonOutput) {
            response.render('error_' + errCode,
                function (err, html) {
                    if (err) {
                        console.log("Jade error:" + err);
                        response.render('error_general');
                        return false;
                    }
                    response.end(html);
                }
            );
        }
        else {
            response.send(errCode);
        }
    };

    //--------End API controller

    //--------Direct links provider API
    app.get("/api/getdirectlink", function (request, response) {
        try {
            var url = decodeURIComponent(request.query.url);
            console.log("Getting direct link for " + url);
            if (!url) showError(request, response, 404, true);
            providers.getDirectLink(app, url, function (directURL) {
                console.log("DURL:" + directURL);
                if (!directURL) showError(request, response, 404, true);
                else response.send(directURL);
            });

        }
        catch (e) {
            console.log("Error while getting direct URL for video " + url + " " + e);
            response.send(500);
        }
    });


    app.get("/api/getepisodedirectvideo", function (request, response) {
        try {
            var url = decodeURIComponent(request.query.url);
            console.log("Getting direct link for " + url);
            if (!url) showError(request, response, 404, true);
            providers.getDirectLink(app, url, function (directURL) {
                console.log("DURL:" + directURL);
                if (!directURL) showError(request, response, 404, true);
                else response.send(directURL);
            });
        }
        catch (e) {
            console.log("Error while getting direct URL for video " + url + " " + e);
            response.send(500);
        }
    });


//--------End direct links provider API

//--------Deferred request API
    app.get("/api/request/get", function (request, response) {
        Q.pull(function (item) {
            response.json(item);
        });
    });

    app.get("/api/request/put", function (request, response) {
        Q.rrxResponseReceived(request.query, function (status) {
            response.send(status);
        })
    });


//--------End deferred request API

//--------Auth API
//check for valid key when using API

    app.all('/api/acquirekey', function (req, res) {
        auth.initializeKey(function (key) {
            if (!key) {
                res.end('Key was NOT created, sorry =(');
                return false;
            }
            //success
            res.end(key);
            return true;
        });
    });

    /*app.all('/api*/
    /*', function (req, res, next) {
     var key = req.query.key;
     auth.checkKey(key, function (result) {
     if (result) {
     next();
     return true;
     }
     res.send(403, 'key not provided or not valid');
     });
     });*/

//--------End auth API

//-----------Search API
    app.get("/search", function (request, response) {
        var query = decodeURIComponent(request.query.q);
        var mode = request.query.mode;
        if (!mode || mode == "s") {
            f.findSeriesByName(query, function (res) {
                if (res.length > 0) {
                    show(request, response, {title: "Поиск: " + query, series: res}, 'search');
                }
                else {
                    showError(request, response, 404);
                }
            });
        }
        else if (mode == "p") {
            f.findPeopleByName(query, function (res) {
                if (res.length > 0) {
                    show(request, response, {title: "Поиск: " + query, people: res}, 'search');
                }
                else {
                    showError(request, response, 404);
                }
            });
        }
    });
//-----------End search API


//-----------Common API

    app.get("/series/:id", function (request, response) {
        var id = request.params.id;
        if (!id) {
            showError(request, response, 404);
            return false;
        }
        f.getSeriesById(request.params.id, function (res) {
            show(request, response, res, 'series');
        });
    });

    app.get("/latest", function (request, response) {
        f.getLatestSeries(100, function (res) {
            show(request, response, res, 'seriesList');
        });
    });

//-----------End common API


//----------Genres API

    app.get("/genres", function (request, response) {
        f.getGenres(function (res) {
            show(request, response, res, 'genreList');
        });
    });

    app.get("/genre/:id", function (request, response) {
        var id = request.params.id;
        if (!id) {
            showError(request, response, 404);
            return false;
        }
        f.getGenreSeriesById(id, 100, 0, function (res) {
            show(request, response, res, 'seriesList');
        });
    });


    app.get("/api/setgenres", function (request, response) {
        f._addGenres();
        setTimeout(
            function () {
                /*f._setSimilar(function(){
                 response.send("OK");
                 });*/

                response.send("OK");
            }, 1000);
    });


//------------End Genres API


//------------People API

    app.get("/people/:id", function (request, response) {
        var id = request.params.id;
        if (!id) {
            showError(request, response, 404);
            return false;
        }
        f.getPersonSeries(id, function (res) {
            show(request, response, {title: res.name_ru, series: res.series}, 'person');
        });
    });


//------------End People API

}

