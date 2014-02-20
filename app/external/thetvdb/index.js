function TheTvDbParser(key) {
    this.key = key;
    this.api = require("./api.js");
    this.show = {};
    this.util = {};
    this.util.compare = require('../../util/compare');


    this.show.searchForShow = function (series, callback) {
        var _this = this;
        var key = this.key;
        var showTitle,
            searchLang = 'ru', //default value
            seriesList = [];
        if (!series) {
            console.log("Series name is empty, aborting!");
            callback(false);
            return;
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
            callback(false);
            return;
        }

        //set language for appropriate language
        this.api(key).setLanguage(searchLang);

        this.api(key).getSeries(showTitle, function (err, res) {
            if (err) {
                callback(false);
                return false;
            }
            // '=' is NOT an error here
            // seriesList containts either array of series or false
            if ((!err) && (seriesList = seriesFound(res))) {
                var seriesId = getProperSeriesId(series, seriesList);
                if (!seriesId) {
                    console.log("The show hasn't been found on theTVDB");
                    callback(false);
                    return false;
                }


                //get episodes list from the chosen series
                _this.api(key).getFullSeriesInfoById(seriesId, function (err, res) {
                    if (!err) {
                        callback(updateSeriesData(series, JSON.parse(JSON.stringify(res))));
                        return true;
                    }
                });

                return true;
            }

            console.log(err);
            callback(false);
        });
    }.bind(this);

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
        //do the check anyway (even if the series number = 1)
        for (i = 0; i < seriesNumber; i++) {
            console.log(i);
            currentSeries = seriesList[i];
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
            i;

        episodeList = tvdbSeries.Data.Episode;
        episodeQuantity = episodeList.length;
        if (!episodeQuantity) {
            console.log("No episodes in list:" + episodeQuantity);
            return false;
        }

        //do non-cyclic stuff

        //add imdbid to the series, stripping first 2 characters ('tt')
        if (tvdbSeries.Data.Series.IMDB_ID) {
            series.imdbid = tvdbSeries.Data.Series.IMDB_ID;
            series.imdbid = series.imdbid.substr(2);
        }

        //cycle through episodes of this series
        for (i = 0; i < episodeQuantity; i++) {
            tvdbEpisode = episodeList[i];
            seasonNumber = tvdbEpisode.SeasonNumber;
            episodeNumber = tvdbEpisode.EpisodeNumber;
            //season actually exists (site has some videos)
            if (!series.season[seasonNumber]) {
                console.log("No such season:" + seasonNumber);
                continue;
            }
            episode = series.season[seasonNumber].episode[episodeNumber];

            if (!episode) {
                console.log("NO episode for season " + seasonNumber + " ep:" + episodeNumber);
                continue;
            }

            console.log("Updating info for season " + seasonNumber + " ep:" + episodeNumber);
            episode.name = tvdbEpisode.EpisodeName;
            episode.description = tvdbEpisode.Overview;
            if (tvdbEpisode.filename) {
                episode.thumbnail = tvdbEpisode.filename;
            }

            //save episode
            series.season[seasonNumber].episode[episodeNumber] = episode;
        }
        return series;
    };

}

module.exports = TheTvDbParser;