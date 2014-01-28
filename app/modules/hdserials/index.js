/**
 *  HDSerials plugin for Showtime
 *
 *  Copyright (C) 2013 Buksa, Wain
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
//ver 0.7.0 API


module.exports = function (app) {

    var PATH = '/modules/';
    var PREFIX = 'hdserials';
    PATH = PATH + PREFIX;
    var REQ, RES, NEXT;
    var RQ = require('./request.js');
    var BASE_URL = 'http://hdserials.galanov.net/backend/model.php';


    function start(req, res, next) {
        var rqData = {id: 'common-categories'};
        //making main variables available to the module
        REQ = req;
        RES = res;
        NEXT = next;

        RQ.makeRequest(BASE_URL, 'GET', rqData, onRequestFinished);

    }


    function comdirHandler(req, res, next) {
        var id = req.params.id;
        var page = req.query.page || 0; //dirty hack
        console.log(page);
        var itemsPerPage = 20; //hardcoded
        var rqData = {
            id: 'sub-categories',
            parent: id,
            start: page * itemsPerPage + 1
        };

        console.log("SUB-CAT ID:" + rqData.parent);
        console.log("SUB-CAT PAGE:" + rqData.start);

        REQ = req;
        RES = res;
        NEXT = next;

        RQ.makeRequest(BASE_URL, 'GET', rqData, onRequestFinished);

    }

    function subdirHandler(req, res, next) {
        var id = req.params.id;
        //make some offset params in the routing scheme
        //before that, it'll load only first page
        //also, timeout system needs to be implemented
        var rqData = {
            id: 'filter-videos',
            category: id,
            fresh: 1,
            start: 0,
            limit: 20
        };

        REQ = req;
        RES = res;
        NEXT = next;

        RQ.makeRequest(BASE_URL, 'GET', rqData, onRequestFinished);
    }

    function itemHandler(req, res, next) {
        var id = req.params.id;
        var rqData = {
            id: 'video',
            video: id
        };

        REQ = req;
        RES = res;
        NEXT = next;

        RQ.makeRequest(BASE_URL, 'GET', rqData, onRequestFinished);
    }

    function videoHandler(req, res, next) {

        REQ = req;
        RES = res;
        NEXT = next;

        var url = req.query.url;
        url = getVideoLink(url, function (url) {
            RES.end("Video link:" + url);
        });


    }

    function onRequestFinished(error, response, body) {
        try {
            var resJSON = JSON.parse(body);
            //render it with JADE
            //render the page with received view
            RES.render(resJSON.id,
                { dataArray: resJSON.data }
            );
        }
        catch (err) {
            RES.end("Error happenned: " + err);
        }


    }


    function getTimeDifference(startUnix, endUnix) {
        return endUnix - startUnix; //in milliseconds
    }


    function getVideoLink(url, callback) {
        var result_url = url,
            fname, v;
        if ((url.indexOf("vk.com") > 0) || (url.indexOf("/vkontakte.php?video") > 0) || (url.indexOf("vkontakte.ru/video_ext.php") > 0) || (url.indexOf("/vkontakte/vk_kinohranilishe.php?id=") > 0)) {
            RQ.makeRequest(url, "GET", false, function (error, response, v) {
                    if (v.match('This video has been removed from public access.')) {
                        result_url = v.match('This video has been removed from public access.');
                        return result_url;
                    }

                    try {
                        var video_host = v.match("var video_host = '(.+?)';")[1];
                        var video_uid = v.match("var video_uid = '(.*)'")[1];
                        var video_vtag = v.match("var video_vtag = '(.*)'")[1];
                        var video_no_flv = v.match("video_no_flv =(.*);")[1];
                        var video_max_hd = v.match("var video_max_hd = '(.*)'")[1];
                        console.log(video_no_flv);

                    }
                    catch (err) {
                        console.log("Error while getting video:" + err.message);
                        return false;
                    }

                    if (video_no_flv == 1) {
                        switch (video_max_hd) {
                            case "0":
                                fname = "240.mp4";
                                break;
                            case "1":
                                vfname = "360.mp4";
                                break;
                            case "2":
                                fname = "480.mp4";
                                break;
                            case "3":
                                fname = "720.mp4";
                                break;
                        }
                        result_url = video_host + "u" + video_uid + "/videos/" + video_vtag + "." + fname;
                    } else {
                        var vkid = v.match("vkid=(.*)&" [1]);
                        fname = "vk.flv";
                        result_url = "http://" + video_host + "/assets/videos/" + video_vtag + vkid + "." + fname;
                    }
                    if (callback) callback(result_url);
                },
                {
                    headers: {
                        'User-Agent': 'Opera/9.80 (Windows NT 6.0) Presto/2.12.388 Version/12.14'
                    }
                });

        }
        //endif

        else {
            v = url.match("video\/(.*?)\/iframe")[1];
            console.log("VIdeo_token:" + v);
            RQ.makeRequest('http://moonwalk.cc/sessions/create_session', "POST", {video_token: v}, function (error, response, resJSON) {
                resJSON = JSON.parse(resJSON);
                result_url = 'hls:' + resJSON.manifest_m3u8;
                if (callback) callback(result_url);
            });


        }
        //end else
    }


    //making paths
    app.get(PATH, start);
    app.get(PATH + '/list/:id', comdirHandler);
    app.get(PATH + '/sublist/:id', subdirHandler);
    app.get(PATH + '/item/:id', itemHandler);
    app.get(PATH + '/get', videoHandler);

}