module.exports = function (db) {
    //db is currently active database connection


    //defining models

    var Series = db.define('series',
        {
            title: {type: 'text', required: true},
            country: {type: 'text'},
            year: {type: 'text'},
            imdbid: {type: 'number', defaultValue: 0, rational: false},
            kpid: {type: 'number', defaultValue: 0, rational: false},
            tvrageId: {type: 'number', defaultValue: 0, rational: false},
            status: {type: 'text'},
            description: {type: 'text'}
        });

    var Genre = db.define('genre',
        {
            genre: {type: 'text', required: true},
            genre_text: {type: 'text', required: true}
        });


    var Season = db.define('season',
        {
            num: {type: 'number', required: true},
            series_num: {type: 'number', required: true},
            status: {type: 'text'},
            description: {type: 'text'}
        });

    var Episode = db.define('episode',
        {
            title: {type: "text"},
            duration: {type: 'number', defaultValue: 0},
            air_date: {type: 'date', required: true, time: false},
            status: {type: 'text'},
            description: {type: 'text'}
        });

    var Video = db.define('video',
        {
            title: {type: "text"},
            url: {type: 'text', required: true},
            source: {type: 'text', defaultValue: 'Unknown'}
        });

    var Poster = db.define('poster',
        {
            url: {type: 'text', required: true}
        });

    var Query = db.define('query',
        {
            module: {type: "text", required: true},
            url: {type: 'text', required: true},
            type: {type: 'text', required: true},
            status: {type: 'text', required: true, defaultValue: 'queued'},
            result: {type: 'text', big: true}
        });

    //defining associations among models
    Series.hasMany('genre', {
        weight: {type: 'number'}
    });

    Series.hasMany('posters', {
        weight: {type: 'number'}
    });

    Season.hasOne('series', Series, {reverse: 'seasons'});

    Episode.hasOne('season', Season, {reverse: 'episodes'});

    Video.hasOne('episode', Episode, {reverse: 'videos'});

    Poster.hasOne('series', Series, {reverse: 'posters'});

    Poster.hasOne('season', Season, {reverse: 'posters'});

    Poster.hasOne('episode', Episode, {reverse: 'posters'});

    //use this ONLY for first run. This code creates tables on the database
    /*    db.sync(function(err) {
     !err && console.log("done!");
     });
     */


}
