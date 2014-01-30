/**
 * Created with JetBrains WebStorm.
 * User: wain-_000
 * Date: 30.01.14
 * Time: 19:54
 * To change this template use File | Settings | File Templates.
 */


function myShowsAPI() {

    this.RQ = require('./request.js');
    this.HOST = 'http://api.myshows.ru';
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


    this.searchForShow = function (show, callback) {
        console.log(this.HOST);
        var rqString = this.HOST + this.SCHEME.public.search_show + encodeURIComponent(show);
        var _this = this;
        this.RQ.makeRequest(rqString, "GET", false, function (error, response, body) {
            if (response.statusCode === _this.RC.HTTP.OK) {
                if (callback) callback(JSON.parse(body));
            }
            else if (response.statusCode === _this.RC.HTTP.NotFound) {
                console.log("Item not found");
                if (callback) callback(_this.RC.HTTP.NotFound);
            }
        });

    }

    this.getGenres = function (callback) {
        var rqString = this.HOST + this.SCHEME.public.genres;
        var _this = this;
        this.RQ.makeRequest(rqString, "GET", false, function (error, response, body) {
            if (response.statusCode === _this.RC.HTTP.OK) {
                if (callback) callback(JSON.parse(body));
            }
        });
    }

}

module.exports = myShowsAPI;









