var base_uri = "http://services.tvrage.com/feeds",
    language = "en",
    request = require("../../util/request"),
    parser = require("xml2json"),
    config = require("../../core/config"),
    userAgent = config.http.userAgent.desktop.opera;
request = new request(userAgent, 'GET');

module.exports = function () {

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


    //  Series

    resources.getSeries = function (name, cb) {
        var url = base_uri + "full_search.php?show=" + encodeURIComponent(name);
        parsereq(url, cb);
    };

    resources.getSeriesById = function (id, cb) {
        var url = base_uri + "showinfo.php?sid=" + encodeURIComponent(id);
        parsereq(url, cb);
    };


    resources.getFullSeriesInfoById = function (id, cb) {
        var url = base_uri + "full_show_info.php?sid=" + encodeURIComponent(id);
        parsereq(url, cb);
    };

    return resources;
};
