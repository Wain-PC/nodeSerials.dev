module.exports = function (app) {

    var PATH = '/modules/';
    var PREFIX = 'hdserials';
    PATH = PATH + PREFIX;
    var REQ, RES, NEXT;
    var Request = require('../../util/request');
    var CONFIG = require('../../core/config');
    var USER_AGENT = CONFIG.http.userAgent.mobile.android_hdserials;
    var RqGet = new Request(app, USER_AGENT, 'GET');
    var RqPost = new Request(app, USER_AGENT, 'POST');
    var BASE_URL = 'http://hdserials.galanov.net/backend/model.php';
    var Series = require('../../core/series');


    function start(req, res, next) {
        var rqData = {id: 'common-categories'};
        //making main variables available to the module
        REQ = req;
        RES = res;
        NEXT = next;

        comdirHandler(1);  //series
        //comdirHandler(3);  //animated series
        //comdirHandler(5);  //tv shows
        //comdirHandler(6);  //anime
    }


    function comdirHandler(id, page) {
        page = page || 0; //dirty hack
        var itemsPerPage = 20; //hardcoded
        var rqData = {
            id: 'sub-categories',
            parent: id,
            start: page * itemsPerPage + 1
        };

        var request = new Request(app, USER_AGENT, 'GET');
        request.makeDeferredRequest(BASE_URL, rqData, function (error, response, body) {
            try {
                var items = JSON.parse(body),
                    i = 0,
                    id;
                items = items.data;
                for (i = 0; i < items.length; i++) {
                    id = items[i].id;
                    subdirHandler(id, 0);
                }
            }
            catch (e) {
                console.log('Error in comDirHandler! Error:' + e + ' Json body:' + body);
            }
        });
    }

    function subdirHandler(id, page) {
        page = page || 0; //dirty hack
        var itemsPerPage = 20; //hardcoded
        var rqData = {
            id: 'filter-videos',
            category: id,
            fresh: 1,
            start: page * itemsPerPage,
            limit: 20
        };

        var request = new Request(app, USER_AGENT, 'GET');
        request.makeDeferredRequest(BASE_URL, rqData, onsubDirRequestFinished);
    }

    function itemHandler(id, season) {
        var rqData = {
            id: 'video',
            video: id
        };

        var request = new Request(app, USER_AGENT, 'GET');
        request.makeDeferredRequest(BASE_URL, rqData, function (error, response, body) {

            try {
                var obj = JSON.parse(body);
                //if we've got the season number earlier, inject it to json
                if (season) {
                    obj.season = season;
                }
                var series = getFilledSeries(obj);
                series.addShow(function (res) {
                    //series added to the DB!
                });
            }
            catch (e) {
                console.log("Error in itemHandler, probably JSON parsing related. JSON Body:" + body);
            }


        });
    }

    function videoHandler(req, res, next) {

        REQ = req;
        RES = res;
        NEXT = next;

        var url = req.query.url;
        getVideoLink(url, function (url) {
            RES.end("Video link:" + url);
        });


    }

    function onsubDirRequestFinished(error, response, body) {
        try {
            var resJSON = JSON.parse(body);
            //render it with JADE
            //render the page with received view


            for (var i = 0; i < resJSON.data.length; i++) {
                if (resJSON.data[i].season) {
                    resJSON.data[i].season = resJSON.data[i].season.replace(/\D/g, '');
                }
                //prepare requests for actual items, then add them to DB
                itemHandler(resJSON.data[i].id, resJSON.data[i].season);
            }


        }
        catch (err) {
            console.log("Error happenned within subdir: " + err);
        }
    }

    function getFilledSeries(json) {
        try {
            var series = new Series(app);
            var j = json;
            injectedSeason = j.season;
            j = j.data;

            if (!j.found) throw new Error('Item not found');

            var i, l, s, e, file;

            //do non-cyclic stuff

            series.setProperties(
                {
                    title_en: j.info.title_en,
                    title_ru: j.info.title_ru,
                    year: j.info.year,
                    kpid: j.info.kp_id,
                    description: j.info.description
                });

            //add people found
            //adding actors
            l = j.actors.length;
            for (i = 0; i < l; i++) {
                series.addPeople(j.actors[i].title_ru);
            }

            //iterate over found episodes
            l = j.files.length;
            for (i = 0; i < l; i++) {
                file = j.files[i];
                s = file.season;
                e = file.episode;

                //wrong season or episode number provided, try to search title
                if (!s || s == 0) {
                    //if the season number has been passed manually
                    if (injectedSeason) {
                        s = injectedSeason;
                    }
                    else {
                        s = getSeasonNumber(file.title);
                    }
                }

                if (!e || e == 0) {
                    e = getEpisodeNumber(file.title);
                }

                series.addEpisode(
                    {
                        seasonNumber: s,
                        episodeNumber: e,
                        video: {
                            url: file.url,
                            type: file.type
                        }
                    });
            }

            return series;
        }
        catch (err) {
            console.log("Error while AllNewParsing:" + err.message);
            return false;
        }
    }

    function getSeasonNumber(text) {
        var s;
        var reSeason = /(\d+).?Сезон/i;
        var se = reSeason.exec(text);
        if (se) s = se[1];
        else {
            reSeason = /Сезон.?(\d+)/i;
            se = reSeason.exec(text);
            if (se) s = se[1];
        }
        //nothing worked. Assume it's season 1
        if (!s || s == 0) {
            s = 1;
        }
        return s;
    }

    function getEpisodeNumber(text) {
        var s;
        var reSeason = /(\d+).?Серия/i;
        var se = reSeason.exec(text);
        if (se) s = se[1];
        else {
            reSeason = /Серия.?(\d+)/i;
            se = reSeason.exec(text);
            if (se) s = se[1];
        }
        //nothing worked. Assume it's season 1
        if (!s || s == 0) {
            s = 1;
        }
        return s;
    }

    //making paths
    app.get(PATH, start);
    app.get(PATH + '/list/:id', comdirHandler);
    app.get(PATH + '/sublist/:id', subdirHandler);
    app.get(PATH + '/item/:id', itemHandler);
    app.get(PATH + '/get', videoHandler);

};