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
    var MS = require('../../external/myshows');
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

        RQ.makeRequest(BASE_URL, 'GET', rqData, parse);
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

    function onRequestFinished(error, response, body) {
        try {
            var resJSON = JSON.parse(body);
            //render it with JADE
            //render the page with received view
            RES.render(resJSON.id,
                { dataArray: resJSON.data, rawData: body }
            );
        }
        catch (err) {
            RES.end("Error happenned: " + err);
        }
    }

    //simple middleware
    function parse(error, response, body) {

        var series = simpleParser(body);

        if (series.title_en) {
            console.log("Getting info from myshows.ru");
            var ms = new MS();
            ms.searchForShow(series.title_en, function (obj) {
                console.log(JSON.stringify(obj));
                RES.end(JSON.stringify(obj));
            });
        }
        else {
            console.log('NO en title of the show!');
            RES.end('CANNNOT PARSE!');
        }

    }

    function getVideoLink(url, callback) {
        var result_url = url,
            fname;
        RQ.makeRequest(url, "GET", false, function (error, response, v) {

                if ((url.indexOf("vk.com") > 0) || (url.indexOf("/vkontakte.php?video") > 0) || (url.indexOf("vkontakte.ru/video_ext.php") > 0) || (url.indexOf("/vkontakte/vk_kinohranilishe.php?id=") > 0)) {
                    //vk.com video
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
                                fname = "360.mp4";
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

                }
                //endif
                else {
                    //hdserials video (moonwalk.cc load balancer)
                    var video_token = /video_token: '(.+?)'/.exec(v)[1];
                    var video_secret = /video_secret: '(.+?)'/.exec(v)[1];
                    console.log("VIdeo_token:" + v);
                    RQ.makeRequest('http://moonwalk.cc/sessions/create_session', "POST", {video_token: video_token, video_secret: video_secret}, function (error, response, resJSON) {
                        resJSON = JSON.parse(resJSON);
                        result_url = 'hls:' + resJSON.manifest_m3u8;
                        if (callback) callback(result_url);
                    });


                }
                //end else

            },
            {
                headers: {
                    'User-Agent': 'Opera/9.80 (Windows NT 6.0) Presto/2.12.388 Version/12.14'
                }
            });
    }

    function simpleParser(rawJSON) {
        //  try {
        var j = JSON.parse(rawJSON);
        j = j.data;

        if (!j.found) throw new Error('Item not found');
        var series = {},
            genre = [],
            season = [],
            people = [];

        series = {
            title_en: j.info.title_en,
            title_ru: j.info.title_ru,
            year: j.info.year
        };

        console.log("EN TITLE:" + JSON.stringify(j.info));

        var i, l;

        //adding genres
        l = j.genres.length;
        for (i = 0; i < l; i++) {
            genre.push({
                genre: j.genres[i].title_ru,
                genre_text: j.genres[i].title_ru
            });
        }

        series.genre = genre;

        //adding actors
        l = j.actors.length;
        for (i = 0; i < l; i++) {
            people.push({
                name: j.actors[i].title_ru
            });
            console.log("Creating person " + j.actors[i].title_ru);
        }

        //adding seasons
        l = j.files.length;
        var s = 0;
        for (i = 0; i < l; i++) {
            s = j.files[i].season;
            if (!season[s]) {
                //create season
                console.log("Creating season " + s);
                season[s] = {};
                //create episode array
                season[s].episode = []
            }
        }

        series.season = season;
        console.log("Got " + series.season.length + " seasons!");

        //adding episodes to seasons
        var e = 0,
            file;
        l = j.files.length;
        for (i = 0; i < l; i++) {
            file = j.files[i];
            s = file.season;
            e = file.episode;
            //console.log("Creating episode " + e + " of season " + s);
            series.season[s].episode[e] = {
                title: file.title,
                video: []
            };
            series.season[s].episode[e].video.push({
                title: file.title,
                url: file.url,
                type: file.type
            });

        }

        console.log("Returning series: " + series.title_en);
        return series;

        /*}


         catch (err) {
         console.log('Parsing failed: ' + err);
         return false;
         }*/

    }


    //making paths
    app.get(PATH, start);
    app.get(PATH + '/list/:id', comdirHandler);
    app.get(PATH + '/sublist/:id', subdirHandler);
    app.get(PATH + '/item/:id', itemHandler);
    app.get(PATH + '/get', videoHandler);

};