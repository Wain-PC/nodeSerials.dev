//@TODO: Redesign jade templates positioning
module.exports = function (app) {

    var PATH = '/modules/';
    var PREFIX = 'newhdk';
    PATH = PATH + PREFIX;
    var USER_AGENT = 'Opera/9.80 (Windows NT 6.0) Presto/2.12.388 Version/12.14';  //@TODO: move this to config
    var Request = require('../../util/request');
    var RqGet = new Request(USER_AGENT, 'GET');
    var RqPost = new Request(USER_AGENT, 'POST');
    var BASE_URL = 'http://hdkinoteatr.com';
    var Series = require('../../core/series');

    function genreList(req, res, next) {
        //making main variables available to the module
        var REQ = req,
            RES = res,
            NEXT = next;

        //make genre list
        debug(BASE_URL + '/catalog/');

        var noGenreCallback = function (error, response, respond) {
            console.log("Main page load");
            var re = /<ul class="cats">([\s\S]*)<\/ul>/; //finding menu
            var menuHTML = respond.match(re)[1];

            re = /<li><a href="\/([\S]*)\/">(\S*)<\/a><\/li>/g;
            var menu = re.exec(menuHTML);
            var data = new Array;
            while (menu) {
                //menu[1] is href, menu[2] is title
                data.push({
                    url: menu[1],
                    title: menu[2]
                });
                //getting next menu item
                menu = re.exec(menuHTML);
            }

            //render page with Jade
            RES.render('genreList', {dataArray: data});

            //disregard that, just output plain json
            //RES.json({"rootArray": data});
        };

        RqGet.makeRequest(BASE_URL + '/catalog/', false, noGenreCallback);
    }

    function moviesList(req, res, next) {
        //making main variables available to the module
        var REQ = req,
            RES = res,
            NEXT = next;

        var genre = REQ.params.genre;
        //pagination support
        var pageNumber = req.query.page;
        if (!pageNumber) pageNumber = 1;

        var loadItems = function (pageNumber) {
            try {
                debug("Time to make some requests now!");
                //make request here

                RqGet.makeRequest(BASE_URL + '/' + genre + '/page/' + pageNumber + '/', false,
                    function (error, response, body) {
                        //simple proxying of response HTTP status code
                        RES.statusCode = response.statusCode;

                        var list = listScraper(body, true);
                        //render page with Jade
                        RES.render('moviesList', {dataArray: list});
                        //disregard that, just output plain json
                        //RES.json({"rootArray": list});
                    });
            } catch (err) {
                //end of pages
                debug("ERR:" + err.message);
            }
        };

        loadItems(pageNumber);
    }

    //This is ASYNCRONOUS CALLBACK HELL! BEWARE STRANGERS!!!
    function moviePage(req, res, next) {
        var i = 0,
            j = 0;
        var videoURL;
        var series = new Series();

        var REQ = req,
            RES = res,
            NEXT = next;

        var url = decodeURIComponent(REQ.params.url);

        //get the respond
        RqGet.makeRequest(url, false, function (error, response, respond) {

            //got the respond
            var re,
                dataArray = [],
                videoURL,
                videoType,
                poster,
                replacing = '',
                s,
                e,
                showTitle,
                providers = require('../../providers');

            //getting the poster
            var rePoster = /<div class="img"><a href="\/(\S*)"/;
            poster = rePoster.exec(respond);
            if (poster) {
                poster = poster[1];
                debug("Got poster:" + poster);
            }

            //getting the replacer
            re = /code=code\.replace\(([\s\S]{0,300})\);/;
            replacing = re.exec(respond);
            replacing = 'code.replace(' + replacing[1] + ');';

            //getting show title
            var reName = /<title>(.*?) - смотреть онлайн/i;
            showTitle = reName.exec(respond);
            showTitle = getSeriesTitles(showTitle[1]);
            console.log("ShowTitle:"+JSON.stringify(showTitle));
            //setting props
            series.setProperties(
                {
                    title_en: showTitle.title_en,
                    title_ru: showTitle.title_ru
                });

            //default regex
            re = /makePlayer\('([\S\s]{0,300})'\);/;

            var code = re.exec(respond);
            // ONLY ONE ITEM ON THE PAGE-----------------------------------------------------
            if (code) {
                code = code[1];
                code = mutateCode(code,replacing);
                //if you don't know the video type, get it with providers interface
                videoType = providers.getProviderFromURL(videoURL);
                if (videoType == 'vk') {
                    videoURL = 'http://vk.com/video_ext.php?' + code;
                }

                series.addEpisode(
                    {
                        seasonNumber: 1,
                        episodeNumber: 1,
                        video: {
                            url: videoURL,
                            type: videoType
                        }
                    });
            }
            // END ONE ITEM---------------------------------------

            // MORE ITEMS-----------------------------------------
            else {
                //regexp to get episodes array
                re = /var vkArr=\[\{([\s\S]*)\}\];/;
                var videoList = re.exec(respond);
                if (videoList) {
                    videoList = eval('[{' + videoList[1] + '}]');

                    for (i = 0; i < videoList.length; i++) {

                        //playlist contains several seasons--------------------------------
                        if (videoList[i].playlist) {
                            //videoList[i].comment is a SEASON NAME
                            s = getSeasonNumber(videoList[i].comment);
                            //looping through series in a season
                            for (j = 0; j < videoList[i].playlist.length; j++) {
                                e = getEpisodeNumber(videoList[i].playlist[j].comment);
                                videoURL = videoList[i].playlist[j].file;
                                videoType = providers.getProviderFromURL(videoURL);
                                if (videoType == 'vk') {
                                    videoURL = mutateCode(videoURL,replacing);
                                    videoURL = 'http://vk.com/video_ext.php?' + videoURL;
                                }

                                series.addEpisode(
                                    {
                                        seasonNumber: s,
                                        episodeNumber: e,
                                        video: {
                                            url: videoURL,
                                            type: videoType
                                        }
                                    });
                            }
                        }

                        //it's a series (without seasons)---------------------------------
                        else {
                            videoURL = videoList[i].file;
                            videoType = providers.getProviderFromURL(videoURL);
                            s = getSeasonNumber(videoList[i].comment);
                            e = getEpisodeNumber(videoList[i].comment);
                            if (videoType == 'vk') {
                                videoURL = mutateCode(videoURL,replacing);
                                videoURL = 'http://vk.com/video_ext.php?' + videoURL;
                            }
                            series.addEpisode(
                                {
                                    seasonNumber: s,
                                    episodeNumber: e,
                                    video: {
                                        url: videoURL,
                                        type: videoType
                                    }
                                });
                        }
                    }
                    //end of cycle
                }
            }
            //render the data array
            //RES.render('moviePage', {dataArray: dataArray, replacer: replacing});

            parse(series,function(series){
                RES.end(JSON.stringify(series));
            })
        });
    }

    function mutateCode(code,replacing) {
        return eval(replacing);
    }

    function parse(series,callback) {

        var MS = require('../../parsers/myshows');
        var myShowsParser = new MS();
        var TVDB = require("../../parsers/thetvdb");
        var theTvDbParser = new TVDB("1F31F9C2BDB72379");

        myShowsParser.show.searchForShow(series, function (obj) {
            if (obj) {
                series.merge(obj);
            }
            theTvDbParser.show.searchForShow(series, function (obj) {
                series.merge(obj);
                callback(series);
            });
        });
    }

    function getSeriesTitles(text) {
        var names = text.split('/'),
            name,
            retObj = {};
        var i = 0;
        for (i = 0; i < names.length; i++) {
            name = names[i].trim();
            //excluding '!?' and year from the end of the string
            name = name.replace(/^(.+?)(?:[!?]?)(?: \(\d{4}\))?$/i, '$1');
            if (/[А-ЯЁ]/gi.test(name)) { //russian symbols
                retObj.title_ru = name;
            }
            else {
                retObj.title_en = name;
            }
        }
        return retObj;
    }

    function getSeasonNumber(text) {
        var s;
        var reSeason = /(\d+).?Сезон/i;
        var se = reSeason.exec(text);
        if (se) s = se[1];
        else {
            reSeason = /Сезон.?(\d+)/i;
            se = reSeason.exec(text);
            if (se) s = se[1];
        }
        //nothing worked. Assume it's season 1
        if (!s || s == 0) {
            s = 1;
        }
        return s;
    }

    function getEpisodeNumber(text) {
        var s;
        var reSeason = /(\d+).?Серия/i;
        var se = reSeason.exec(text);
        if (se) s = se[1];
        else {
            reSeason = /Серия.?(\d+)/i;
            se = reSeason.exec(text);
            if (se) s = se[1];
        }
        //nothing worked. Assume it's season 1
        if (!s || s == 0) {
            s = 1;
        }
        return s;
    }


    function getMovie(req, res, next) {

        var REQ = req,
            RES = res,
            NEXT = next;

        var url = decodeURIComponent(REQ.params.url);
        var replacer = decodeURIComponent(REQ.query.replacer);

        getPlayerURL(url, replacer, function (video) {
            if (!video) {
                RES.end("Это видео недоступно для просмотра");
                return false;
            }

            RES.end("Got VURL:" + video);
            //RES.json({'videoURL': video});
        });


    }

    function getPlayerURL(code, replacing, callback) {
        var video_url = false;

        if (code.search(/^oid=/) != -1) {
            code = eval(replacing);
            video_url = 'http://vk.com/video_ext.php?' + code;

            //this CAN be empty (false returned if the video is not available)
            getVideoLink(video_url, function (video_url) {
                debug("LINK:" + video_url);
                if (callback) callback(video_url);
            });
        }


        else if (code.search(/moonwalk/) != -1) {
            debug("MW");
            getVideoLink(code, function (video_url) {
                if (callback) callback(video_url);
            });
        }

        else if (code.search(/kset.kz/i) != -1) {
            code = code.replace(/([^a-z]{1})width=(['"\\]*)[0-9]+(['"\\]*)/gi, "$1width=$2" + viWidth + "$3").replace(/height=(['"\\]*)[0-9]+(['"\\]*)/gi, "height=$1" + viHeight + "$2");
            video_url = '<iframe src="http://www.autobonus.kz/kset.php?code=' + encodeURIComponent(code) + '" ' + ' frameborder="0"></iframe>';
        }
        else if (code.search(/<(object|embed) /i) == 0) {
            code = code.replace(/([^a-z]{1})width=(['"\\]*)[0-9]+(['"\\]*)/gi, "$1width=$2" + viWidth + "$3").replace(/height=(['"\\]*)[0-9]+(['"\\]*)/gi, "height=$1" + viHeight + "$2");
            video_url = code;
        }
        else if (code.search(/\.(3gp|aac|f4v|flv|m4a|mp3|mp4)/i) != -1) {
            if (!document.getElementById('uppod_player')) {

                video_url = code;
            }
            else {
                video_url = code;
            }
        }
        else if (code.search(/video\.rutube\.ru/i) != -1) {
            code = code.replace(/^.*?(http:[^"]+).*?$/, '$1');
            video_url = code;
        }
        else if (code.search('youtube') != -1) {
            //youtube video
            code = code.match(/.*youtube.*\/embed\/([\S]*)\?autoplay/)[1];
            debug('YOUTUBE!: ' + code);
            video_url = 'youtube:video:' + code;

        }

        return video_url;
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


    function listScraper(respond, encodeURL) {


        var re = /<h.? class="btl"><a href="([\S]*)"[\s\S]{0,300}.?>([\S\s]{0,300})<\/a><\/h.?>/g;

        var items = [],
            i = 0;

        var item = re.exec(respond);

        while (item) {
            debug("Found title:" + item[2]);

            if (encodeURL) {
                item[1] = encodeURIComponent(item[1]);
            }
            items.push({
                url: item[1],
                title: item[2]
            });
            item = re.exec(respond);
        }

        re = /<div class="img">[\S\s]{0,300}<img src="\/(\S*)"/g;

        item = re.exec(respond);

        while (item) {
            items[i].image = item[1];
            i++;

            item = re.exec(respond);
        }


        debug('Returning list with ' + items.length + ' items');

        return items;

    }

    function getPoster(req, res, next) {
        if (!req.params[0]) {
            debug("No url found");
            return false;
        }
        var url = BASE_URL + '/uploads/' + req.params[0];
        RqGet.makeRequest(url, false, function (error, response, body) {
            res.end(body, 'binary');
        });
    }

    //syntax sugar for compatibility
    function debug(msg) {
        console.log(msg);
    }

    //setting paths
    app.get(PATH, genreList);
    app.get(PATH + '/genre/:genre', moviesList);
    app.get(PATH + '/item/:url', moviePage);
    app.get(PATH + '/item/get/:url', getMovie);
    app.get(PATH + '/uploads/*', getPoster);

};
