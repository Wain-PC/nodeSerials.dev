function TheTvDbParser(key) {
    this.key = key;
    this.api = require("./api.js");
    this.show = {};


    this.show.searchForShow = function (series, callback) {
        var _this = this;
        var key = this.key;
        var showTitle,
            searchLang = 'ru'; //default value
        if (!series) {
            console.log("Series name is empty, aborting!");
            callback(false);
            return;
        }

        if (series.title_en) {
            console.log("Got en title!");
            showTitle = series.title_en;
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
            if (!err) {

                if (res.Data.Series.length) {
                    //@TODO: select needed series from the list
                    var seriesId = res.Data.Series[0].seriesid;

                    //get episodes list from the chosen series
                    _this.api(key).getFullSeriesInfoById(seriesId, function (err, res) {
                        console.log("Full res:" + JSON.stringify(res));
                        callback(res);
                        return true;
                    });
                    console.log("Got info from theTVDB successfully:" + JSON.stringify(res));
                    //callback(res);
                    return true;
                }
            }

            console.log(err);
            callback(false);
        });
    }.bind(this);

}

module.exports = TheTvDbParser;