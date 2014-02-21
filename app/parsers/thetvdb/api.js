var base_uri = "http://thetvdb.com/api/",
    language = "en",
    request = require("../../util/request"),
    parser = require("xml2json"),
    userAgent = 'Opera/9.80 (Windows NT 6.0) Presto/2.12.388 Version/12.14'; ////@TODO: move this to config

request = new request(userAgent, 'GET');

module.exports = function (access_token) {

    var resources = {};

    function parsereq(url, cb) {
        request.makeRequest(url, false, function (error, response, body) {
            if (error) {
                cb(error, false, false);
            }
            if (response.statusCode === 200) {
                jsonbody = parser.toJson(body, {object: true, sanitize: false});
                if (jsonbody.Error) {
                    error = jsonbody.Error;
                    jsonbody = null;
                }
                cb(error, jsonbody);
            }
            else {
                cb(error ? error : "Could not complete the request", null);
            }
        });
    }


    //  Languages

    resources.getLanguages = function (cb) {
        var url = base_uri + access_token + "/languages.xml";
        parsereq(url, cb);
    };

    resources.getLanguage = function () {
        return language;
    };

    resources.setLanguage = function (lang) {
        language = lang;
    };


    //  Time

    resources.getTime = function (cb) {
        var url = base_uri + "Updates.php?type=none";
        parsereq(url, cb);
    };


    //  Series

    resources.getSeries = function (name, cb) {
        var url = base_uri + "GetSeries.php?seriesname=" + name + "&language=" + language;
        parsereq(url, cb);
    };

    resources.getSeriesByImdbId = function (id, cb) {
        var url = base_uri + "GetSeriesByRemoteID.php?imdbid=" + id + "&language=" + language;
        parsereq(url, cb);
    };


    resources.getSeriesById = function (id, cb) {
        var url = base_uri + access_token + "/series/" + id + "/" + language + ".xml";
        parsereq(url, cb);
    };


    resources.getFullSeriesInfoById = function (id, cb) {
        var url = base_uri + access_token + "/series/" + id + "/all/" + language + ".xml";
        parsereq(url, cb);
    };

    resources.getActors = function (id, cb) {
        var url = base_uri + access_token + "/series/" + id + "/actors.xml";
        parsereq(url, cb);
    };

    resources.getBanners = function (id, cb) {
        var url = base_uri + access_token + "/series/" + id + "/banners.xml";
        parsereq(url, cb);
    };


    //  Updates

    resources.getUpdates = function (time, cb) {
        var url = base_uri + "Updates.php?type=all&time=" + time;
        parsereq(url, cb);
    };

    return resources;
};
