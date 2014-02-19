/**
 * Created with JetBrains WebStorm.
 * User: wain-_000
 * Date: 30.01.14
 * Time: 19:54
 * To change this template use File | Settings | File Templates.
 */


function myShowsAPI() {

    var Request = require('../../util/request');
    var USER_AGENT = 'Opera/9.80 (Windows NT 6.0) Presto/2.12.388 Version/12.14';

    this.RQ = new Request(USER_AGENT, 'GET');
    this.HOST = 'http://api.myshows.ru';
    this.show = {};
    this.util = {};
    this.util.objectMerger = require('../../util/merge');
    this.util.compare = require('../../util/compare');
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
            'search_show': '/shows/search/?q=',
            'search_file': '/shows/search/file/?q=',
            'show_info': '/shows/',
            'genres': '/genres/',
            'shows_top': '/shows/top/',
            'profile': '/profile/'
        },
        profile: {
            'login': '/profile/login?login=%s&password=%s',
            'shows': '/profile/shows/',
            'watched-episodes': '/profile/shows/%d/',
            'next-episodes': '/profile/episodes/next/',
            'unwatched-episodes': '/profile/episodes/unwatched/',
            'check-episode': '/profile/episodes/check/%d',
            'check-episode-rating': '/profile/episodes/check/%d?rating=%d',
            'uncheck-episode': '/profile/episodes/uncheck/%d',
            'rate-episode': '/profile/episodes/rate/%d/%d',
            'sync-episodes': '/profile/shows/%d/sync?episodes=%s',
            'sync-episodes-delta': '/profile/shows/%d/episodes?check=%s&uncheck=%s',
            'show-status': '/profile/shows/%d/%s',
            'show-rating': '/profile/shows/%d/rate/%d',
            'favorites-list': '/profile/episodes/favorites/list/',
            'favorites-add': '/profile/episodes/favorites/add/%d',
            'favorites-remove': '/profile/episodes/favorites/remove/%d',
            'ignored-list': '/profile/episodes/ignored/list/',
            'ignored-add': '/profile/episodes/ignored/add/%d',
            'ignored-remove': '/profile/episodes/ignored/remove/%d',
            'friends-news': '/profile/news/'
        }
    };


    this.show.searchForShow = function (series, callback) {
        try {
            var _this = this;
            var showTitle;

            //add merge ability to the series
            series.merge = _this.objectMerger;

            if (series.title_en) {
                console.log("Got en title!");
                showTitle = series.title_en;
            }
            else if (series.title_ru) {
                console.log("Got RU title!");
                showTitle = series.title_ru;
            }
            else {
                console.log("Sorry, cannot parse empty title");
                callback(false);
                return;
            }

            var rqString = _this.HOST + _this.SCHEME.public.search_show + encodeURIComponent(showTitle);

            this.RQ.makeRequest(rqString, "GET", false, function (error, response, body) {
                if (response.statusCode === _this.RC.HTTP.OK) {
                    console.log("Response OK");
                    obj = _this.util.toUniversal(JSON.parse(body), series);
                    if (callback) callback(obj);
                }
                else if (response.statusCode === _this.RC.HTTP.NotFound) {
                    console.log("Item not found in MS database");
                    //try again using only the first word of the title

                    if (callback) callback(false);
                }
                else {

                }
            });
        }
        catch (err) {
            //some error happened
            callback("ERR:" + err);
            return;
        }
    }.bind(this);


    this.util.toUniversal = function (obj, series) {
        var _this = this;
        var mss,
            counter = 0,
            titleFound = false;
        //iterating over incoming object
        for (var id in obj) {
            counter++;
            console.log("iterating over incoming object");
            //obj is our Series object
            //mss is MyShows Series object
            mss = obj[id];
            console.log(JSON.stringify(mss));

            console.log("KPIDS Challenge:" + series.kpid + " " + mss.kinopoiskId + " " + (series.kpid == mss.kinopoiskId));
            if (_this.util.compare(series.imdbid, mss.imdbid, series.kpid, mss.kinopoiskId, series.tvrageid, mss.tvrageid)) {
                console.log("Item found by ID");
                titleFound = true;
                //breaking here because matching ids are the guarantee of the success
                break;
            }

            else if (_this.util.compare(series.title_en, mss.title, series.title_ru, mss.ruTitle)) {
                //assuming it's what we need
                console.log("Item found by title (probably)");
                titleFound = true;
                //additional check using year
                console.log(series.year + " vs " + mss.year);
                if (_this.util.compare(series.year, mss.year)) {
                    console.log("Year matches!");
                }
            }
        }

        if (titleFound) {
            console.log("Title found and updated successfully from the total of " + counter + " tries");
            series.merge(_this.util.extractNeededData(mss));
            return series;
        }
        //title not found
        return series;


    }.bind(this);

    this.getGenres = function (callback) {
        var rqString = this.HOST + this.SCHEME.public.genres;
        var _this = this;
        this.RQ.makeRequest(rqString, "GET", false, function (error, response, body) {
            if (response.statusCode === _this.RC.HTTP.OK) {
                if (callback) callback(JSON.parse(body));
            }
        });
    }.bind(this);

    this.util.extractNeededData = function (mss) {
        var series = {};
        series.title = mss.title;
        if (mss.ruTitle) series.title_ru = mss.ruTitle;
        if (!series.poster && mss.image) series.poster = mss.image;
        series.status = mss.status;
        series.kpid = mss.kinopoiskId;
        series.tvrageId = mss.tvrageId;
        series.imdbid = mss.imdbid;
        return series;
    }

}

module.exports = myShowsAPI;









