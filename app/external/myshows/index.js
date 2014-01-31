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


    this.show.searchForShow = function (showTitle, callback) {
        try {
            var _this = this;
            console.log("HOST:" + _this.HOST);
            var rqString = _this.HOST + _this.SCHEME.public.search_show + encodeURIComponent(showTitle);
            console.log("Going for:" + rqString);

            this.RQ.makeRequest(rqString, "GET", false, function (error, response, body) {
                if (response.statusCode === _this.RC.HTTP.OK) {
                    console.log("Response OK");
                    _this.show.toUniversal(JSON.parse(body));
                    if (callback) callback(JSON.parse(body));
                }
                else if (response.statusCode === _this.RC.HTTP.NotFound) {
                    console.log("Item not found in MS database");
                    if (callback) callback(_this.RC.HTTP.NotFound);
                }
            });
        }
        catch (err) {
            //some error happened
            callback("ERR:" + err);
        }
    }.bind(this);


    this.show.toUniversal = function (obj) {

        //iterating over incoming object
        for (var id in obj) {
            console.log("iterating over incoming object");
            var series = obj[id];
            for (var prop in series) {
                // important check that this is objects own property
                // not from prototype prop inherited
                if (series.hasOwnProperty(prop)) {
                    console.log(prop + " = " + series[prop]);
                }
            }
        }


    }

    this.getGenres = function (callback) {
        var rqString = this.HOST + this.SCHEME.public.genres;
        var _this = this;
        this.RQ.makeRequest(rqString, "GET", false, function (error, response, body) {
            if (response.statusCode === _this.RC.HTTP.OK) {
                if (callback) callback(JSON.parse(body));
            }
        });
    }.bind(this);

}

module.exports = myShowsAPI;









