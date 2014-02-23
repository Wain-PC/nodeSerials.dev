var Series = function () {

    //this.merge = require('../../util/merge');
    //setting base properties
    this.title_en = "",
        this.title_ru = "",
        this.imdbid = 0,
        this.kpid = 0,
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
    }

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
        ;

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
    //@TODO: this is DEFINITELY not safe AT ALL. Need to implement some kind of strict mode
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
        console.log("Object check failed, not all params present. The following params are wrong or not provided:" + JSON.stringify(failedParams));
        return false;
    }
    //now checking for existence
    //check if season exists
    if (is.object(this.season[seNum])) {
        //season exists
        //console.log('Season exists');
        if (is.object(this.season[seNum].episode[epNum])) {
            //episode exists
            console.log("Episode " + epNum + " of season " + seNum + " already exists. Overwriting!");
            //updating info
            result = this.updateEpisode(seNum, epNum, video);
        }
        else {
            //Season exists, episode doesn't exist, creating one
            console.log('Season exists, episode doesnt: creating one');
            result = this.createEpisode(seNum, epNum, video);
        }
    }
    //season doesn't exist
    else {
        //create season, then create episode
        console.log('Create season AND episode');
        this.season[seNum] = {};
        result = this.createEpisode(seNum, epNum, video);
    }
    return result;

};

Series.prototype.addPoster = function (posterURL) {
    //poster can be either string or array
    var is = require('../../util/is');
    //got actual poster
    if (is.string(posterURL) && ifImage(posterURL)) {
        this.poster.push(posterURL);
        return true;
    }
    console.log("No valid image URL found for poster. Poster NOT added.");
    return false;

    function ifImage(url) {
        return /^https?:\/\/(?:[a-z\-]+\.)+[a-z]{2,6}(?:\/[^/#?]+)+\.(?:jpg|jpeg|png)$/i.test(url);
    }
};

Series.prototype.addShow = function (callback) {
    //count total length of episodes here
    //if no episodes present, parsing shouldn't be done
    var _this = this;
    if (this.getEpisodesCount() == 0) {
        callback(this);
        return false;
    }

    var MS = require('../../parsers/myshows');
    var myShowsParser = new MS();
    var TVDB = require("../../parsers/thetvdb");
    var theTvDbParser = new TVDB("1F31F9C2BDB72379");

    myShowsParser.show.searchForShow(this, function (obj) {
        if (obj) _this.merge(obj);
        theTvDbParser.show.searchForShow(_this, function (obj) {
            if (obj) _this.merge(obj);
            callback(_this);
        });
    });
};

Series.prototype.merge = require('../../util/merge');

module.exports = Series;