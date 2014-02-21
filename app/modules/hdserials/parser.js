var HDSerialsParser = function () {
    var MS = require('../../parsers/myshows');
    this.myShowsParser = new MS();
    var TVDB = require("../../parsers/thetvdb");
    this.theTvDbParser = new TVDB("1F31F9C2BDB72379"); //@TODO: move this to config
};


HDSerialsParser.prototype.parse = function (json, callback) {
    try {
        var _this = this;
        var series = simpleParser(json);
        //adding merge ability to series
        series.merge = require('../../util/merge');
        //try to parse with MyShowsParser
        console.log("Searching for show on MyShows");


        _this.myShowsParser.show.searchForShow(series, function (obj) {
            series = updateSeries(series, obj);
            _this.theTvDbParser.show.searchForShow(series, function (obj) {
                series = updateSeries(series, obj);
                callback(series);
            });
        });


    }
    catch (err) {
        console.log("Error happenned while parsing!:" + err.message);
        if(series) {
            //at least, return what we've had before fail occured
            callback(series);
        }
        else {
            callback(false);
        }

    }
};


function updateSeries(series, returnedSeries) {

    if (returnedSeries) {
        series.merge(returnedSeries);
    }
    return series;
}


function simpleParser(rawJSON) {
    try {
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
            year: j.info.year,
            kpid: j.info.kp_id,
            description: j.info.description,
            poster: []
        };

        //adding poster
        var reImage = /^.*(\.jpg)$/i;
        var poster = reImage.exec(j.info.image_file);
        if (poster) {
            console.log("Poster found: " + j.info.image_file + " - ");
            series.poster.push(j.info.image_file);
        }
        else {
            console.log("Poster NOT found: " + j.info.image_file);
            //series.poster is an empty array
        }

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
                season[s].episode = [];
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

            //wrong season or episode number provided, try to search title
            var reSeason = /Серия.?(\d+)/i;
            var se = reSeason.exec(file.title);
            if (se) e = se[1];
            else {
                reSeason = /(\d+).?Серия/i;
                se = reSeason.exec(file.title);
                if (se) s = se[1];
            }

            var reEpisode = /Серия.?(\d+)/i;
            var ep = reEpisode.exec(file.title);
            if (ep) e = ep[1];
            else {
                reEpisode = /(\d+).?Серия/i;
                ep = reEpisode.exec(file.title);
                if (ep) e = ep[1];
            }
            console.log("SEASON:" + s + " EPISODE:" + e);
            //@TODO: what to do if we don't know the season?!


            //console.log("Creating episode " + e + " of season " + s + " : " + file.title);
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
        return series;
    }
    catch (err) {
        console.log(err.message);
        return false;
    }
}

module.exports = HDSerialsParser;