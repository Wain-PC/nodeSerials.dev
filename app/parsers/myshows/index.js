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
    this.util.compare = require('../../util/compare');
    this.util.is = require('../../util/is');
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
        }
    };


    this.genreAssociationTable = {
        "1": 1,
        "2": 2,
        "4": 3,
        "5": 4,
        "6": 5,
        "7": 6,
        "8": 11,
        "9": 7,
        "10": 8,
        "11": 9,
        "12": 10,
        "18": 11,
        "23": 12,
        "25": 13,
        "26": 14,
        "27": 15,
        "28": 16,
        "29": 17,
        "30": 18,
        "31": 19,
        "32": 20,
        "33": 21,
        "34": 22,
        "35": 23,
        "36": 24,
        "37": 25,
        "38": 26,
        "39": 27,
        "40": 28,
        "41": 29,
        "43": 30,
        "44": 31,
        "45": 32,
        "46": 33,
        "50": 34,
        "52": 35,
        "54": 36,
        "56": 37,
        "57": 38,
        "63": 39,
        "69": 40,
        "70": 41,
        "75": 42,
        "82": 43,
        "93": 44,
        "95": 41,
        "98": 28,
        "99": 41
    };


    this.show.searchForShow = function (series, callback) {
        try {
            var _this = this;
            var showTitle;

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
            this.RQ.makeRequest(rqString, false, function (error, response, body) {
                if (response.statusCode === _this.RC.HTTP.OK) {
                    console.log("Response OK");
                    obj = _this.util.toUniversal(JSON.parse(body), series);
                    if (callback) callback(obj);
                    return true;
                }
                else {
                    if (response.statusCode === _this.RC.HTTP.NotFound) {
                        console.log("Item not found in MS database");
                    }
                    else {
                        console.log("Something strange happened:" + response);
                    }
                }
                if (callback) callback(false);
                return false;

            });
        }
        catch (err) {
            //some error happened
            console.log("ERR hapened in myshows parser:" + err);
            callback(false);
        }
    }.bind(this);

    this.util.toUniversal = function (obj, series) {
        var _this = this;
        var mss,
            counter = 0,
            titleFound = false,
            foundSeries;
        //iterating over incoming object
        for (var id in obj) {
            counter++;
            //obj is our Series object
            //mss is MyShows Series object
            mss = obj[id];

            //console.log("KPIDS Challenge:" + series.kpid + " " + mss.kinopoiskId + " " + (series.kpid == mss.kinopoiskId));
            if (_this.util.compare(series.imdbid, mss.imdbid, series.kpid, mss.kinopoiskId, series.tvrageid, mss.tvrageId)) {
                console.log("Item found by ID");
                titleFound = true;
                foundSeries = mss;
                //breaking here because matching ids are the guarantee of the success
                break;
            }

            else if (_this.util.compare(series.title_en, mss.title, series.title_ru, mss.ruTitle)) {
                //assuming it's what we need
                console.log("Item found by title (probably)" + JSON.stringify(mss));
                titleFound = true;
                foundSeries = mss;
                break;
            }
        }

        if (titleFound) {
            console.log("Title found and updated successfully from the total of " + counter + " tries");
            _this.util.extractNeededData(series, foundSeries);
            return series;
        }
        //title not found
        return series;


    }.bind(this);

    this.util.getAlignedGenres = function (genres) {
        var retArr = [],
            genreNum;
        console.log("Got " + genres.length + " genres from myshows");
        for (var i = 0; i < genres.length; i++) {
            //if the association is found, add resulting genre to the returned array
            if (this.util.is.number(genreNum = this.genreAssociationTable[genres[i]])) {
                console.log("Found matching genre " + genreNum + " for myShows genre " + genres[i]);
                retArr.push(genreNum);
            }
        }
        return retArr;
    }.bind(this);

    this.getGenres = function (callback) {
        var rqString = this.HOST + this.SCHEME.public.genres;
        var _this = this;
        this.RQ.makeRequest(rqString, false, function (error, response, body) {
            console.log(body);
            if (response.statusCode === _this.RC.HTTP.OK) {
                if (callback) callback(JSON.parse(body));
            }
        });
    }.bind(this);

    this.util.extractNeededData = function (series, mss) {
        var is = this.util.is;
        var _this = this;
        if (mss.title && !is.russian(mss.title)) series.title_en = mss.title;
        if (mss.ruTitle && is.russian(mss.ruTitle)) series.title_ru = mss.ruTitle;
        series.addPoster(mss.image);
        series.setProperties({
            status: mss.status,
            kpid: mss.kinopoiskId,
            tvrageid: mss.tvrageId,
            imdbid: mss.imdbId
        });
        series.addGenres(_this.util.getAlignedGenres(mss.genres));
        return series;
    }.bind(this);
}

module.exports = myShowsAPI;









