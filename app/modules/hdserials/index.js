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


    function trim(s) {
        s = s.replace(/(\r\n|\n|\r)/gm, "");
        s = s.replace(/(^\s*)|(\s*$)/gi, "");
        s = s.replace(/[ ]{2,}/gi, " ");
        return s;
    }


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
            video: id,
        };

        REQ = req;
        RES = res;
        NEXT = next;

        RQ.makeRequest(BASE_URL, 'GET', rqData, onRequestFinished);
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


    //making paths
    app.get(PATH, start);
    app.get(PATH + '/list/:id', comdirHandler);
    app.get(PATH + '/sublist/:id', subdirHandler);
    app.get(PATH + '/item/:id', itemHandler);

}