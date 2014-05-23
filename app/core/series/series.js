var Series = function (app) {

    //@TODO: support for mixed episodes (like 1-2 or 1,2)
    //setting base properties
    this.title_en = "",
        this.title_ru = "",
        this.description = "",
        this.imdbid = 0,
        this.kpid = 0,
        this.tvrageid = 0,
        this.thetvdbid = 0,
        this.status = "",
        this.year;

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
            this.season[s].episode[e].title = "Серия " + e;
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

    //check whether the titles are OK
    var tempTitle = "";
    var is = require('../../util/is');
    if (is.string(_this.title_ru) && !is.russian(_this.title_ru)) {
        //most probably, this is EN title
        //check if the en title actually exists
        if (is.string(_this.title_en)) {
            console.log("TEN:" + is.string(_this.title_en));
            if (is.russian(_this.title_en)) {
                //okay, this is definitely a swap, perform it
                console.log("Wrong title order, performing a swap!");
                tempTitle = _this.title_en;
                _this.title_en = _this.title_ru;
                _this.title_ru = tempTitle;
            }
            else {
                //shit, this is not russian
                //remove title_ru as misspelled
                _this.title_ru = "";
                console.log("Title_ru disintergated for being EN!");
            }
        }
        else {
            //no EN title, we should move RU title to EN, and remove the former
            _this.title_en = _this.title_ru;
            _this.title_ru = "";
            console.log("Moving RU title to EN!");
        }
    }


    var CONFIG = require('../../core/config');
    var GOOGLE = require("../../parsers/google")
    var googleParser = new GOOGLE(_this.getApp());
    var MS = require('../../parsers/myshows');
    var myShowsParser = new MS(_this.getApp());
    var TVDB = require("../../parsers/thetvdb");
    var theTvDbParser = new TVDB(_this.getApp(), CONFIG.parsers.thetvdb.api_key);


    googleParser.show.searchForShow(this, function (obj) {
        myShowsParser.show.searchForShow(_this, function (obj) {
            if (obj) _this.merge(obj);
            theTvDbParser.show.searchForShow(_this, function (obj) {
                if (obj) _this.merge(obj);
                _this.saveSeries(callback);
            });
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
        var Sequelize = models.Sequelize;


        models.sequelize.transaction(function (t) {
            mSeries = ModelSeries.find(
                {
                    where: //one of the following statements is true
                        Sequelize.or(      //at least on of the ID's match (if NOT 0)
                            {imdbid: (_this.imdbid == 0 ? -1 : _this.imdbid)},
                            {kpid: (_this.kpid == 0 ? -1 : _this.kpid)},
                            {thetvdbid: (_this.thetvdbid == 0 ? -1 : _this.thetvdbid)},
                            {tvrageid: (_this.tvrageid == 0 ? -1 : _this.tvrageid)},
                            Sequelize.and( //both titles match (if no ID's are present
                                {
                                    title_ru: _this.title_ru,
                                    title_en: _this.title_en
                                }
                            )
                        )
                },
                { transaction: t }
            );


            mSeries.success(function (series) {
                //gonna create new Series object, if such series doesn't exist in the database
                if (!series) {
                    mSeries = ModelSeries.create({
                            title_ru: _this.title_ru,
                            title_en: _this.title_en,
                            imdbid: _this.imdbid,
                            kpid: _this.kpid,
                            thetvdbid: _this.thetvdbid,
                            tvrageid: _this.tvrageid,
                            status: _this.status,
                            description: _this.description
                        },
                        { transaction: t });

                    mSeries.success(function (series) {
                        performActualDataSave(t, series);
                    });
                }
                //we have found such series in the database, just write into it
                else {
                    performActualDataSave(t, series);
                }
            });

            mSeries.error(function (err) {
                console.log('ERR DB:' + err);
            });


            t.commit().success(function () {
                console.log("Transaction success!");
            })

            t.done(function () {
                console.log("100% DONE!");
            })
        });
        //----------------------END OF TRANSACTION


        callback(this);


        function performActualDataSave(t, series) {

            var mSeason,
                mEpisode,
                mVideo,
                mPoster,
                i, j, k;

            //save posters
            for (i = 0; i < _this.poster.length; i++) {
                ModelPoster.findOrCreate({
                        url: _this.poster[i]
                    },
                    { transaction: t }
                ).success(function (poster) {
                        poster.setSeries(series, { transaction: t });
                    });
            }

            //save genres
            ModelGenre.findAll({
                    where: {id: _this.genre}
                },
                { transaction: t }).success(function (genres) {
                    series.setGenres(genres, { transaction: t });
                    console.log("Saved " + genres.length + " genres for series " + series.title_ru);
                });

            //save people
            for (i = 0; i < _this.people.length; i++) {
                ModelPerson.findOrCreate({
                        name_ru: _this.people[i]
                    },
                    { transaction: t }).success(function (person) {
                        console.log("Person " + JSON.stringify(person) + " created");
                        person.addSeries(series, { transaction: t }).success(function (s) {
                            console.log("Person updated!");
                        });

                    });
            }

            //save Seasons here
            console.log("Seasons saved:" + _this.season.length);
            //save seasons
            for (i = 0; i < _this.season.length; i++) {
                if (!is.object(_this.season[i])) continue;
                //got season
                console.log("Saving season " + i);

                mSeason = ModelSeason.findOrCreate({
                    number: i,
                    SeriesId: series.id
                }, { transaction: t }).success(function (season) {
                        var seasonNumber = season.values.number;
                        console.log("Saved season " + seasonNumber + " for series " + series.values.id);
                        season.setSeries(series, { transaction: t })
                            .success(function () {
                                console.log("Season " + seasonNumber + " updated");
                            });

                        //now save episodes from each season
                        for (j = 0; j < _this.season[seasonNumber].episode.length; j++) {
                            if (!is.object(_this.season[seasonNumber].episode[j])) continue;

                            mEpisode = ModelEpisode.findOrCreate({
                                number: j,
                                SeasonId: season.id
                            }, { transaction: t }).success(function (episode) {
                                    if (is.string(_this.season[seasonNumber].episode[episode.number].title)) episode.title = _this.season[seasonNumber].episode[episode.number].title;
                                    if (!episode.duration) episode.duration = 40;
                                    if (!episode.air_date) episode.air_date = new Date();
                                    if (!episode.description) episode.description = _this.season[seasonNumber].episode[episode.number].description;
                                    if (!episode.thumbnail) episode.thumbnail = _this.season[seasonNumber].episode[episode.number].thumbnail;

                                    var episodeNumber = episode.number;
                                    //perform episode save
                                    episode.save({ transaction: t });
                                    episode.setSeason(season, { transaction: t });

                                    //now save videos for each episode
                                    //console.log(_this.season[seasonNumber].episode[episode.number].thumbnail);
                                    for (k = 0; k < _this.season[seasonNumber].episode[episodeNumber].video.length; k++) {
                                        if (!is.object(_this.season[seasonNumber].episode[episodeNumber].video[k])) continue;
                                        //got video
                                        mVideo = ModelVideo.findOrCreate({
                                            url: _this.season[seasonNumber].episode[episodeNumber].video[k].url,
                                            type: _this.season[seasonNumber].episode[episodeNumber].video[k].type,
                                            EpisodeId: episode.id
                                        }, { transaction: t }).success(function (video) {
                                                //update only title of the video. Type should have been already set by this moment
                                                if (!video.title) video.title = episode.title;
                                                video.save();
                                                video.setEpisode(episode, { transaction: t }).success(function (video) {
                                                    //all done!
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
        }

    }
    catch (err) {
        console.log("ERR HAPPENED:" + err);
    }
};

Series.prototype.merge = require('../../util/merge');

module.exports = Series;