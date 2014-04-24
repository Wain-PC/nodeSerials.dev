/**
 * Created with JetBrains WebStorm.
 * User: wain-_000
 * Date: 30.01.14
 * Time: 19:54
 * To change this template use File | Settings | File Templates.
 */


function googleParser(app) {

    var Request = require('../../util/request');
    var USER_AGENT = 'Opera/9.80 (Windows NT 6.0) Presto/2.12.388 Version/12.14';


    this.RQ = new Request(app, USER_AGENT, 'GET');
    this.HOST = 'http://www.google.ru';
    this.show = {};
    this.is = require('../../util/is');
    this.RC = {
        HTTP: {
            OK: 200,
            NotFound: 404,
            FORBIDDEN: 403,
            SERVER_ERROR: 500
        }
    };
    this.SCHEME = {
        public: {
            'search_show': '/search?q='
        }
    };


    this.show.searchForShow = function (series, callback) {
        try {
            var _this = this;
            var showTitle;

            if (series.title_en) {
                console.log("GOOGLE: Got en title!");
                showTitle = series.title_en;
            }
            else if (series.title_ru) {
                console.log("GOOGLE: Got RU title!");
                showTitle = series.title_ru;
            }
            else {
                console.log("Sorry, cannot parse empty title");
                callback(series);
                return false;
            }

            var rqString = _this.HOST + _this.SCHEME.public.search_show + encodeURIComponent(showTitle),
                rqAddIMDB = encodeURIComponent(" imdb"),
                rqAddKp = encodeURIComponent(" kinopoisk");

            //first, make global request with no additions
            console.log("Global request");
            doStuff(null, function (series) {
                if (!_this.is.number(series.imdbid)) {
                    console.log("IMDB request");
                    doStuff(rqAddIMDB, function (series) {
                        if (!_this.is.number(series.kpid)) {
                            console.log("KPID request");
                            doStuff(rqAddKp, function (series) {
                                callback(series);
                                return true;
                            });
                        }
                        else {
                            callback(series);
                            return true;
                        }
                    });
                }
                else {
                    //all good, at least imdbid found
                    callback(series);
                    return true;
                }
            });

            function doStuff(addition, callback) {
                if (!addition) addition = "";
                _this.RQ.makeRequest(rqString, false, function (error, response, body) {
                    if (response.statusCode === _this.RC.HTTP.OK) {
                        console.log("Response OK");
                        _this.inflateSeriesWithData(series, _this.findData(body));
                        if (callback) callback(series);
                        return true;
                    }
                    else {
                        if (response.statusCode === _this.RC.HTTP.NotFound) {
                            console.log("Item references not found in Google");
                        }
                        else {
                            console.log("Something strange happened:" + response);
                        }
                    }
                    if (callback) callback(series);
                    return false;

                });
            }
        }
        catch (err) {
            //some error happened
            console.log("ERR hapened in myshows parser:" + err);
            callback(series);
        }
    }.bind(this);


    this.findData = function (body) {
        //all we do here is simply try to find refecences to Kinopoisk.ru and IMDB.com
        //in order to extract KPID and IMDBID respectively
        var retData = {
            kpid: null,
            imdbid: null
        };
        var imdbRegExp = /imdb.com\/title\/tt(\d*)\/?/;
        var kpRegExp = /kinopoisk.ru\/film\/(\d*)\/?/;

        var imdbId = imdbRegExp.exec(body);
        if (imdbId) retData.imdbid = imdbId[1];
        var kpId = kpRegExp.exec(body);
        if (kpId) retData.kpid = kpId[1];
        console.log("RETDATA:" + JSON.stringify(retData));
        return retData;
    };


    this.inflateSeriesWithData = function (series, data) {
        if (this.is.number(data.imdbid)) {
            console.log("IMDBid found: " + data.imdbid);
            series.imdbid = data.imdbid;
        }

        if (this.is.number(data.kpid)) {
            console.log("KPid found: " + data.kpid);
            series.kpid = data.kpid;
        }
    }.bind(this);
}

module.exports = googleParser;









