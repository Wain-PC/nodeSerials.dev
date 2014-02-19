function TheTvDbParser(key) {
    this.key = key;
    this.api = require("./api.js");
    this.show = {};
    this.util = {};
    this.util.objectMerger = require('../../util/merge');
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
        console.log("Set language " + searchLang);

        this.api(key).getSeries(showTitle, function (err, res) {
            if (err) {
                callback(false);
                return false;
            }
            // '=' is NOT an error here
            // seriesList containts either array of series or false
            if ((!err) && (seriesList = seriesFound(res))) {
                var seriesId = getProperSeriesId(series, seriesList);

                //get episodes list from the chosen series
                _this.api(key).getFullSeriesInfoById(seriesId, function (err, res) {

                    callback(res);
                    return true;
                });
                console.log("Got info from theTVDB successfully:" + JSON.stringify(res));
                //callback(res);
                return true;
            }

            console.log(err);
            callback(false);
        });
    }.bind(this);

    //thetvdb can return series either as object or as array. Check what's returned and return the former as array for conformity.
    var seriesFound = function (json) {
        if (json.Data && json.Data.Series) {
            if (Object.prototype.toString.call(json) === '[object Array]') {
                return json.Data.Series;
            }
            else {
                return new Array(json.Data.Series);
            }
        }
        return false;
    }

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

        //add merge ability to the series
        series.merge = _this.objectMerger;

        //do the check anyway (even if the series number = 1)
        for (i = 0; i < seriesNumber; i++) {
            currentSeries = seriesList[i];
            console.log("IMDBID's Challenge:" + series.imdbid + " " + currentSeries.IMDB_ID);
            console.log("Title Challenge:" + series.title_ru + " " + currentSeries.SeriesName);
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

}

module.exports = TheTvDbParser;