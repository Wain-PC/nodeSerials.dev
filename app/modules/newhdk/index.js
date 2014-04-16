module.exports = function (app) {

    var PATH = '/modules/';
    var PREFIX = 'newhdk';
    PATH = PATH + PREFIX;
    var CONFIG = require('../../core/config');
    var USER_AGENT = CONFIG.http.userAgent.desktop.opera;
    var Request = require('../../util/request');
    var RqGet = new Request(app, USER_AGENT, 'GET');
    var RqPost = new Request(app, USER_AGENT, 'POST');
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


    function moviePage(req, res, next) {
        var i = 0,
            j = 0;
        var videoURL;
        var series = new Series(app);

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
                poster = BASE_URL + '/' + poster[1];
                debug("Got poster:" + poster);
                series.addPoster(poster);
            }

            //getting the replacer
            re = /code=code\.replace\(([\s\S]{0,300})\);/;
            replacing = re.exec(respond);
            replacing = 'code.replace(' + replacing[1] + ');';

            //getting show title
            var reName = /<title>(.*?) - смотреть онлайн/i;
            showTitle = reName.exec(respond);
            showTitle = getSeriesTitles(showTitle[1]);
            console.log("ShowTitle:" + JSON.stringify(showTitle));
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
                code = mutateCode(code, replacing);
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
                                    videoURL = mutateCode(videoURL, replacing);
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
                                videoURL = mutateCode(videoURL, replacing);
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

            series.addShow(function (res) {
                RES.end(JSON.stringify(res));
            });
        });
    }

    function mutateCode(code, replacing) {
        return eval(replacing);
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
    //app.get(PATH + '/item/get/:url', getMovie);
    app.get(PATH + '/uploads/*', getPoster);

};
