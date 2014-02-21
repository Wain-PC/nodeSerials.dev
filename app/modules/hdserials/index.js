module.exports = function (app) {

    var PATH = '/modules/';
    var PREFIX = 'hdserials';
    PATH = PATH + PREFIX;
    var REQ, RES, NEXT;
    var Request = require('../../util/request');
    var DB = require('../../database');
    var USER_AGENT = 'Android;HD Serials v.1.7.0;ru-RU;google Nexus 4;SDK 10;v.2.3.3(REL)';
    var RqGet = new Request(USER_AGENT, 'GET');
    var RqPost = new Request(USER_AGENT, 'POST');
    var BASE_URL = 'http://hdserials.galanov.net/backend/model.php';
    //parser
    var Parser = require('./parser.js');
    Parser = new Parser();


    function start(req, res, next) {
        var rqData = {id: 'common-categories'};
        //making main variables available to the module
        REQ = req;
        RES = res;
        NEXT = next;

        RqGet.makeRequest(BASE_URL, rqData, onRequestFinished);

    }


    function comdirHandler(req, res, next) {
        var id = req.params.id;
        var page = req.query.page || 0; //dirty hack
        var itemsPerPage = 20; //hardcoded
        var rqData = {
            id: 'sub-categories',
            parent: id,
            start: page * itemsPerPage + 1
        };

        REQ = req;
        RES = res;
        NEXT = next;

        RqGet.makeRequest(BASE_URL, rqData, onRequestFinished);

    }

    function subdirHandler(req, res, next) {
        var id = req.params.id;
        var page = req.query.page || 0; //dirty hack
        var itemsPerPage = 20; //hardcoded
        var rqData = {
            id: 'filter-videos',
            category: id,
            fresh: 1,
            start: page * itemsPerPage,
            limit: 20
        };

        REQ = req;
        RES = res;
        NEXT = next;

        RqGet.makeRequest(BASE_URL, rqData, onRequestFinished);
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

        RqGet.makeRequest(BASE_URL, rqData, parse);
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

        var series = Parser.parse(body, function (series) {
            RES.end(JSON.stringify(series));
        });


    }

    function getVideoLink(url, callback) {
        var result_url = url,
            fname;
        RqGet.makeRequest(url, false, function (error, response, v) {

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
                    RqPost.makeRequest('http://moonwalk.cc/sessions/create_session', {video_token: video_token, video_secret: video_secret}, function (error, response, resJSON) {
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


    //making paths
    app.get(PATH, start);
    app.get(PATH + '/list/:id', comdirHandler);
    app.get(PATH + '/sublist/:id', subdirHandler);
    app.get(PATH + '/item/:id', itemHandler);
    app.get(PATH + '/get', videoHandler);

};