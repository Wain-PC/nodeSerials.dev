function TheTvDbParser(app, key) {
    this.key = key;
    this.api = require("./api.js");
    this.api = new this.api(app, key);
    this.show = {};
    this.util = {};
    this.util.compare = require('../../util/compare');


    this.show.searchForShow = function (series, callback) {
        var _this = this;
        var key = this.key;
        var showTitle,
            searchLang,
            seriesList = [];

        if (!series) {
            console.log("theTVDB parser received empty Series object, aborting search!");
            callback(false);
            return false;
        }

        var res = getTitleAndLanguage(series);
        showTitle = res.title;
        searchLang = res.lang;

        //set language for appropriate language
        this.api.setLanguage(searchLang);

        //if possible, search show by imdb ID
        if (series.imdbid) {
            this.api.getSeriesByImdbId(series.imdbid, function (err, res) {
                console.log("theTVDB Searching by IMDBID:" + series.imdbid);
                if (err || !seriesFound(res)) {
                    _this.api.getSeries(showTitle, function (err, res) {
                        console.log("theTVDB Searching by show title:" + showTitle);
                        mainCallback(_this, err, res, callback, series);
                    });
                }
                else {
                    mainCallback(_this, err, res, callback, series);
                }

            });
        }
        else {
            //if not, search by show title
            this.api.getSeries(showTitle, function (err, res) {
                console.log("theTVDB Searching by show title:" + showTitle);
                mainCallback(_this, err, res, callback, series);
            });
        }


    }.bind(this);

    var getTitleAndLanguage = function (series) {

        var showTitle,
            searchLang = 'ru';

        if (!series) {
            console.log("Series is empty, aborting!");
            return {
                title: showTitle,
                lang: searchLang
            };
        }

        if (series.title_en) {
            console.log("Got en title!");
            showTitle = series.title_en;
            searchLang = 'en';
        }
        else if (series.title_ru) {
            console.log("Got ru title!");
            showTitle = series.title_ru;
            searchLang = 'ru';
        }

        else {
            console.log("Sorry, cannot parse empty title! Aborting!");
        }
        return {
            title: showTitle,
            lang: searchLang
        };
    };

    var mainCallback = function (_this, err, res, callback, series) {
        var seriesList = [];
        if (err) {
            console.log("Error while getting info from theTVDB:" + err);
            callback(false);
            return false;
        }
        // '=' is NOT an error here
        // seriesList containts either array of series or false
        if (seriesList = seriesFound(res)) {
            var seriesId = getProperSeriesId(series, seriesList);
            if (!seriesId) {
                console.log("The show hasn't been found on theTVDB");
                callback(false);
                return false;
            }


            //get episodes list from the chosen series
            _this.api.getFullSeriesInfoById(seriesId, function (err, res) {
                if (!err) {
                    callback(updateSeriesData(series, res));
                    return true;
                }
            });

            return true;
        }

        console.log("No data received for this show");
        callback(false);
        return false;
    }

    //thetvdb can return series either as object or as array. Check what's returned and return the former as array for conformity.
    var seriesFound = function (json) {
        if (json.Data && json.Data.Series) {
            if (Object.prototype.toString.call(json.Data.Series) === '[object Array]') {
                return json.Data.Series;
            }
            else {
                return new Array(json.Data.Series);
            }
        }
        return false;
    };

    //this function selects proper series from the series array, guided by either IMDBid or series title
    var getProperSeriesId = function (series, seriesList) {
        var _this = this;
        var i,
            seriesNumber,
            currentSeries,
            foundSeries,
            titleFound = false;
        //iterating over incoming array
        seriesNumber = seriesList.length;
        if (!seriesNumber) return false;

        //rough assumption, but it works pretty well
        if (seriesNumber == 1) {
            titleFound = true;
            foundSeries = seriesList[0];
            return foundSeries.seriesid;
        }

        console.log("Checking through " + seriesNumber + " occurencies");
        //we move from the end (least possible series first). Though it's slower, it can possibly bring more accurate results.
        for (i = seriesNumber - 1; i >= 0; i--) {
            currentSeries = seriesList[i];
            console.log(currentSeries.SeriesName);
            if (_this.util.compare(series.imdbid, currentSeries.IMDB_ID)) {
                console.log("Item found by IMDBid");
                titleFound = true;
                foundSeries = currentSeries;
                //breaking here because matching ids are the guarantee of the success
                break;
            }

            //compare titles

            else if (_this.util.compare(series.title_en, currentSeries.SeriesName, series.title_ru, currentSeries.SeriesName)) {
                //assuming it's what we need
                console.log("Item found by title (probably)");

                //if we have more seasons that tvdb has, most probably it's wrong series
                //@TODO: write some kind of probability checker here (with multiple params: imdbid, kpid, name, number of seasons, etc.)

                titleFound = true;
                foundSeries = currentSeries;
            }
        }

        if (titleFound) {
            console.log("Title found and updated successfully from the total of " + seriesNumber + " items");
            return foundSeries.seriesid;
        }
        //title not found
        return false;
    }.bind(this);

    var updateSeriesData = function (series, tvdbSeries) {
        var episodeList,
            episodeQuantity,
            seasonNumber,
            episodeNumber,
            tvdbEpisode,
            episode,
            i,
            baseImageURL = 'http://thetvdb.com/banners/';

        var is = require('../../util/is');

        episodeList = tvdbSeries.Data.Episode;
        if (!episodeList) {
            console.log("Show found on theTVDB, but it has no episodes");
            return false;
        }
        episodeQuantity = episodeList.length;
        if (!episodeQuantity) {
            console.log("No episodes in list:" + episodeQuantity);
            return false;
        }

        //do non-cyclic stuff

        //add thetvdbid to series
        if (tvdbSeries.Data.Series.id) {
            series.thetvdbid = tvdbSeries.Data.Series.id;
        }

        //add imdbid to the series, stripping first 2 characters ('tt')
        if (is.string(tvdbSeries.Data.Series.IMDB_ID)) {
            series.imdbid = tvdbSeries.Data.Series.IMDB_ID;
            series.imdbid = series.imdbid.substr(2);
        }

        //add poster
        if (is.imageURL(baseImageURL + tvdbSeries.Data.Series.poster)) {
            series.addPoster(baseImageURL + tvdbSeries.Data.Series.poster);
        }

        //cycle through episodes of this series
        for (i = 0; i < episodeQuantity; i++) {
            tvdbEpisode = episodeList[i];
            seasonNumber = tvdbEpisode.SeasonNumber;
            episodeNumber = tvdbEpisode.EpisodeNumber;
            //season actually exists (site has some videos)
            if (!series.season[seasonNumber]) {
                //console.log("No such episode:" + seasonNumber + "x" + episodeNumber);
                continue;
            }
            episode = series.season[seasonNumber].episode[episodeNumber];

            if (!episode) {
                //console.log("NO episode for season " + seasonNumber + " ep:" + episodeNumber);
                continue;
            }

            //console.log("Updating info for season " + seasonNumber + " ep:" + episodeNumber + " : " + tvdbEpisode.EpisodeName);
            if (is.string(tvdbEpisode.EpisodeName)) episode.title = tvdbEpisode.EpisodeName;
            if (is.string(tvdbEpisode.Overview)) episode.description = tvdbEpisode.Overview;
            if (is.imageURL(baseImageURL + tvdbEpisode.filename)) {
                episode.thumbnail = baseImageURL + tvdbEpisode.filename;
            }

            //save episode
            series.season[seasonNumber].episode[episodeNumber] = episode;
        }

        return series;
    };

}

module.exports = TheTvDbParser;