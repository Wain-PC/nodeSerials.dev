var Series = function (app) {

    //@TODO: support for mixed episodes (like 1-2 or 1,2)
    //setting base properties
    this.title_en = "",
        this.title_ru = "",
        this.description = "",
        this.imdbid = 0,
        this.kpid = 0,
        this.tvrageid = 0,
        this.status = "",
        this.year,
        this.thetvdbid = 0;

    //setting arrays structure
    this.genre = [],
        this.people = [],
        this.season = [],
        this.poster = [];

    //private variables
    var totalEpisodes = 0;
    this.getEpisodesCount = function () {
        return totalEpisodes;
    };

    this.getApp = function () {
        return app;
    };

    this.createEpisode = function (s, e, video) {
        //create season (if not exists)
        var is = require('../../util/is');
        var result;

        //check if video exists. If not, we shouldn't create such episode
        if (!video || !is.object(video)) {
            console.log("Episode has no videos");
            return false;
        }

        if (!is.object(this.season[s])) {
            this.season[s] = {};
        }

        //create episode array (if not exists)
        if (!this.season[s].episode) {
            this.season[s].episode = [];
        }


        this.season[s].episode[e] = {
            video: []
        };
        result = this.updateEpisode(s, e, video);
        if (result) totalEpisodes++;
        return result;

    };

    this.updateEpisode = function (s, e, video) {
        try {
            this.season[s].episode[e].video.push({
                url: video.url,
                type: video.type
            });
            return true;
        }
        catch (err) {
            console.log("Updating episode failed:" + err);
            return false;
        }


    };
};

Series.prototype.setProperties = function (obj) {
    this.merge(obj, true); //merging in strict mode (no new properties will be created during merge)
};

Series.prototype.addEpisode = function (obj) {
    var is = require('../../util/is');
    if (!obj || !is.object(obj)) {
        return false;
    }
    var p,
        seNum,
        epNum,
        video,
        checkSuccessCounter = 0,
        failedParams = [],
        result;

    p = obj.seasonNumber;
    if (is.number(p)) {
        seNum = p;
        checkSuccessCounter++; //should be 1
    }
    else failedParams.push('seasonNumber');

    p = obj.episodeNumber;
    if (is.number(p)) {
        epNum = p;
        checkSuccessCounter++; //should be 2
    }
    else failedParams.push('episodeNumber');

    p = obj.video;
    if (is.object(p)) {
        video = p;
        if (is.string(p.url) && is.string(p.type)) {
            checkSuccessCounter++; //should be 3
        }
        else failedParams.push('video.url or video.type');
    }
    else failedParams.push('video');

    if (checkSuccessCounter != 3) {
        console.log("Object check failed, not all params present. The following params are wrong or not provided:" + failedParams);
        return false;
    }
    //now checking for existence
    //check if season exists
    if (is.object(this.season[seNum])) {
        //season exists
        //console.log('Season exists');
        if (is.object(this.season[seNum].episode[epNum])) {
            //episode exists
            //console.log("Episode " + epNum + " of season " + seNum + " already exists. Overwriting!");
            //updating info
            result = this.updateEpisode(seNum, epNum, video);
        }
        else {
            //Season exists, episode doesn't exist, creating one
            //console.log('Season exists, episode doesnt: creating one');
            result = this.createEpisode(seNum, epNum, video);
        }
    }
    //season doesn't exist
    else {
        //create season, then create episode
        //console.log('Create season AND episode');
        this.season[seNum] = {};
        result = this.createEpisode(seNum, epNum, video);
    }
    return result;

};

Series.prototype.addPoster = function (posterURL) {
    //poster can be either string or array
    var is = require('../../util/is');
    //got actual poster
    if (is.imageURL(posterURL)) {
        this.poster.push(posterURL);
        return true;
    }
    console.log("No valid image URL found for poster. Poster NOT added.");
    return false;
};

//this method can get both array and string
Series.prototype.addPeople = function (people) {
    var is = require('../../util/is');
    if (!is.array(people) && !is.string(people)) {
        console.log("Adding people failed. Provided parameter is neither array or string");
        return false;
    }
    //no matter if it's an array or string, one method will do the trick
    this.merge.call(this.people, people);
    return true;
};

//this method can get both array and number
Series.prototype.addGenres = function (genres) {
    var is = require('../../util/is');
    if (!is.array(genres) && !is.number(genres)) {
        console.log("Adding genres failed. Provided parameter is neither array or number");
        return false;
    }
    //no matter if it's an array or number, one method will do the trick
    console.log("Merging " + genres.length + " genres");
    this.genre = this.merge.call(this.genre, genres);
    return true;
};


Series.prototype.addShow = function (callback) {
    //count total length of episodes here
    //if no episodes present, parsing shouldn't be done
    var _this = this;
    if (this.getEpisodesCount() == 0) {
        console.log("Series has no episodes, getting full info aborted!");
        callback(this);
        return false;
    }

    var CONFIG = require('../../core/config');
    var MS = require('../../parsers/myshows');
    var myShowsParser = new MS();
    var TVDB = require("../../parsers/thetvdb");
    var theTvDbParser = new TVDB(CONFIG.parsers.thetvdb.api_key);

    myShowsParser.show.searchForShow(this, function (obj) {
        if (obj) _this.merge(obj);
        theTvDbParser.show.searchForShow(_this, function (obj) {
            if (obj) _this.merge(obj);
            _this.saveSeries(callback);
        });
    });
};

Series.prototype.saveSeries = function (callback) {

    try {
        var _this = this;
        var is = require('../../util/is');
        var models = this.getApp().get('models');
        var ModelSeries = models.Series;
        var ModelSeason = models.Season;
        var ModelEpisode = models.Episode;
        var ModelVideo = models.Video;
        var ModelPoster = models.Poster;
        var ModelGenre = models.Genre;
        var ModelPerson = models.Person;

        var mSeries = ModelSeries.create({
            title_ru: _this.title_ru,
            title_en: _this.title_en,
            imdbid: _this.imdbid,
            kpid: _this.kpid,
            thetvdbid: _this.thetvdbid,
            tvrageid: _this.tvrageid,
            status: _this.status,
            description: _this.description
        });

        var mSeason,
            mEpisode,
            mVideo,
            mPoster,
            i, j, k;

        mSeries.success(function (series) {
            //save posters
            for (i = 0; i < _this.poster.length; i++) {
                ModelPoster.create({
                    url: _this.poster[i]
                }).success(function (poster) {
                        poster.setSeries(series);
                    });
            }

            //save genres
            ModelGenre.findAll({
                where: {id: _this.genre}
            }).success(function (genres) {
                    series.setGenres(genres);
                    console.log("Saved " + genres.length + " genres for series " + series.title_ru);
                });

            //save people
            for (i = 0; i < _this.people.length; i++) {
                ModelPerson.create({
                    name: _this.people[i]
                }).success(function (person) {
                        console.log("Person " + JSON.stringify(person) + " created");
                        person.addSeries(series).success(function (p) {
                            console.log("Person " + p.name + " SET to series");
                        });

                    });
            }

            //save Seasons here
            console.log("Series saved:" + _this.season.length);
            //save seasons
            for (i = 0; i < _this.season.length; i++) {
                if (!is.object(_this.season[i])) continue;
                //got season
                console.log("Saving season " + i);
                mSeason = ModelSeason.create({
                    number: i
                }).success(function (season) {
                        var seasonNumber = season.values.number;
                        console.log("Saved season " + seasonNumber + " for series " + series.values.id);
                        season.setSeries(series)
                            .success(function () {
                                console.log("Season " + seasonNumber + " updated");
                            });

                        //now save episodes from each season
                        for (j = 0; j < _this.season[seasonNumber].episode.length; j++) {
                            if (!is.object(_this.season[seasonNumber].episode[j])) continue;
                            //got episode
                            mEpisode = ModelEpisode.create({
                                number: j,
                                title: _this.season[seasonNumber].episode[j].name,
                                duration: 40,
                                air_date: new Date(),
                                description: _this.season[seasonNumber].episode[j].description,
                                thumbnail: _this.season[seasonNumber].episode[j].thumbnail
                            })
                                .success(function (episode) {
                                    var episodeNumber = episode.values.number;
                                    episode.setSeason(season)
                                        .success(function () {
                                            console.log("Saved episode " + seasonNumber + 'x' + episodeNumber);
                                        });

                                    //now save videos for each episode
                                    for (k = 0; k < _this.season[seasonNumber].episode[episodeNumber].video.length; k++) {
                                        if (!is.object(_this.season[seasonNumber].episode[episodeNumber].video[k])) continue;
                                        //got video
                                        mVideo = ModelVideo.create({
                                            title: episode.values.title,
                                            url: _this.season[seasonNumber].episode[episodeNumber].video[k].url,
                                            type: _this.season[seasonNumber].episode[episodeNumber].video[k].type
                                        }).success(function (video) {
                                                video.setEpisode(episode)
                                                    .success(function () {
                                                        console.log("Saved video with url" + video.values.url + " for " + seasonNumber + 'x' + episodeNumber);
                                                    });
                                            });
                                    }
                                });
                        }
                    })
                    .error(function (err) {
                        console.log('Season save fail:' + err);
                    });
            }
        });

        mSeries.error(function (err) {
            console.log('ERR DB:' + err);
        });


        callback(this);
    }
    catch (err) {
        console.log("ERR HAPPENED:" + err);
    }
};

var sayAllDone = function (err, items) {
    if (!err) {
        console.log("DB WRITE DONE:" + JSON.stringify(items));
        return true;
    }
    else console.log("DB WRITE ERROR:" + JSON.stringify(err));
    return false;
}

Series.prototype.merge = require('../../util/merge');

module.exports = Series;