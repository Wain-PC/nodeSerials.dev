//@TODO: Redesign jade templates positioning
module.exports = function (app) {

    var PATH = '/modules/';
    var PREFIX = 'hdk';
    PATH = PATH + PREFIX;
    var REQ, RES, NEXT;
    var RQ = require('./request.js');
    var BASE_URL = 'http://hdkinoteatr.com';

    function start(req, res, next) {
        //making main variables available to the module
        REQ = req;
        RES = res;
        NEXT = next;

        var genre = REQ.params.genre;

        if (!genre || genre == 'all') {
            //make genre list
            debug(BASE_URL + '/catalog/');

            var noGenreCallback = function (error, response, respond) {

                var re = /<ul class="cats">([\s\S]*)<\/ul>/; //finding menu
                var menuHTML = respond.match(re)[1];

                re = /<li><a href="\/([\S]*)\/">(\S*)<\/a><\/li>/g;
                var menu = re.exec(menuHTML);
                var data = new Array;
                while (menu) {
                    debug("M:" + menu);
                    //menu[1] is href, menu[2] is title
                    data.push({
                        url: menu[1],
                        title: menu[2]
                    });
                    //getting next menu item
                    menu = re.exec(menuHTML);
                }

                //render page with Jade
                RES.render('index', {dataArray: data});
            };


            RQ.makeRequest(BASE_URL + '/catalog/', 'GET', false, noGenreCallback);


        } //endif
        //genre defined
        else {

            //@TODO: Regesign this hell! Most probably, this can be done a lot easier
            //also, make support for pagination
            var pageNumber = 1;
            var loadItems = function () {
                try {
                    debug("Time to make some requests now!");
                    //make request here

                    debug('L:' + BASE_URL + '/' + genre + '/page/' + pageNumber);
                    RQ.makeRequest(BASE_URL + '/' + genre + '/page/' + pageNumber,'GET',false,
                        function(error, response, body){
                            var list = listScraper(body);
                            //render page with Jade
                            RES.render('index', {dataArray: list});
                            //render page using Jade



                        });
                } catch (err) {
                    //end of pages
                    if (err.message == '404') {
                        debug("Достигнут конец директории");
                    }
                    //most probably server overload
                    else {
                        debug("Подгрузка не удалась. Возможно, сервер перегружен. Error code:"+err.message);
                    }
                }
            };

            loadItems();
        }


    }



    function listScraper(respond) {


        var re = /<h.? class="btl"><a href="([\S]*)"[\s\S]{0,300}.?>([\S\s]{0,300})<\/a><\/h.?>/g;

        var items = new Array(),
            i = 0;

        var item = re.exec(respond);

        while (item) {
            debug("Found title:" + item[2]);
            items.push({
                url: item[1],
                title: item[2]
            });
            item = re.exec(respond);
        }

        re = /<div class="img">[\S\s]{0,300}<img src="(\S*)"/g;

        item = re.exec(respond);

        while (item) {
            debug(item[1]);
            items[i].image = item[1];
            i++;

            item = re.exec(respond);
        }


        debug('Returning list with ' + items.length + ' items');

        return items;

    }


    //syntax sugar for compatibility
    function debug(msg) {
        console.log(msg);
    };

    //setting paths
    app.get(PATH, start);
    app.get(PATH + '/genre/:genre', start);

}
