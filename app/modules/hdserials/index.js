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
    var BASE_URL = 'http://hdserials.galanov.net';


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

        RQ.makeRequest(BASE_URL + '/backend/model.php', rqData, onRequestFinished);

    }


    function comdirHandler(req, res, next) {
        var id = req.params.id;
        var rqData = {
            id: 'common-categories',
            parent: id,
            start: 1
        };

        REQ = req;
        RES = res;
        NEXT = next;

        RQ.makeRequest(BASE_URL + '/backend/model.php', rqData, onRequestFinished);

    }

    function subdirHandler(req, res, next) {
        var id = req.params.id;
        //make some offset params in the routing scheme
        //before that, it'll load only first page
        //also, timeout system needs to be implemented
        var rqData = {
            id: 'filter-videos',
            category: category_id,
            fresh: 1,
            start: 0,
            limit: 20
        };

        REQ = req;
        RES = res;
        NEXT = next;

        RQ.makeRequest(BASE_URL + '/backend/model.php', rqData, onRequestFinished);
    }

    function onRequestFinished(error, response, body) {
        if (response.statusCode == 200 && body) {
            var resJSON = JSON.parse(body);

            //doing whatever we need with the data
            RES.end(body);
        }
    }


    function getTimeDifference(startUnix, endUnix) {
        return endUnix - startUnix; //in milliseconds
    }


    //making paths
    app.get(PATH, start);
    app.get(PATH + '/list/:id', comdirHandler);
    app.get(PATH + '/items/:id', subdirHandler);

}