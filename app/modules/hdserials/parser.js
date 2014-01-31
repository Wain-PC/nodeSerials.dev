var HDSerialsParser = function () {
    var MS = require('../../external/myshows');
    this.myShowsParser = new MS();

};


HDSerialsParser.prototype.parse = function (json) {
    try {
        var _this = this;
        var series = simpleParser(json);

        //try to parse with MyShowsParser
        var title;
        if (series.title_en) {
            console.log("Got en title!");
            title = series.title_en;
        }
        else if (series.title_ru) {
            console.log("Got RU title!");
            title = series.title_ru;
        }
        if (title) {
            console.log("Searching for show on MyShows");
            console.log(typeof(_this.myShowsParser.show.searchForShow));
            _this.myShowsParser.show.searchForShow(title, function (obj) {
                if (typeof(obj) != 'object') return false;
                return series;
            });
        }
    }
    catch (err) {
        return false;
    }
};


function simpleParser(rawJSON) {
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

        //wrong season or episode number provided, try to search title
        var reEpisode = /Серия.?(\d+)/i;
        var ep = reEpisode.exec(file.title);
        if (ep) e = ep[1];
        else {
            reEpisode = /(\d+).?Серия/i;
            ep = reEpisode.exec(file.title);
            if (ep) e = ep[1];
        }

        //what to do if you don't know the season?!


        console.log("Creating episode " + e + " of season " + s + " : " + file.title);
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

}

module.exports = HDSerialsParser;