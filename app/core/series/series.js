var Series = function() {

    //setting utils
    this.merge = require('../../util/merge');
    //setting base properties
    this.title_en = "",
        this.title_ru = "",
        this.imdbid = 0,
        this.kpid = 0,
        this.thetvdbid = 0;

        //setting arrays structure
        this.genre = [],
        this.people = [],
        this.season = [];
    //attach episodes, videos

    this.createEpisode = function(s,e,video) {
        //create season (if not exists)
        var is = require('../../util/is');
        if(!is.object(this.season[s])) {
            this.season[s] = {};
        };

        //create episode array (if not exists)
        if(!this.season[s].episode) {
            this.season[s].episode = [];
        }


        this.season[s].episode[e] = {
            video: []
        };
        this.updateEpisode(s,e,video);
    };

    this.updateEpisode = function(s,e,video) {
        this.season[s].episode[e].video.push({
            url: video.url,
            type: video.type
        });
    };
};

Series.prototype.setProperties = function(obj) {
    //@TODO: this is DEFINITELY not safe AT ALL. Need to implement some kind of strict mode
    this.merge(obj,true); //merging in strict mode (no new properties will be created during merge)
};

Series.prototype.addEpisode = function(obj) {
    var is = require('../../util/is');
    if(!obj || !is.object(obj)) {
        return false;
    }
        var p,
            seNum,
            epNum,
            video,
            checkSuccess = false;

        p = obj.seasonNumber;
        if(is.number(p)) {
            seNum = p;
        }

        p = obj.episodeNumber;
        if(is.number(p)) {
            epNum = p;
        }

        p = obj.video;
        if(is.object(p)) {
            video = p;
            if(is.string(p.url) && is.string(p.type)) {
                checkSuccess = true;
            }
        }

    if(!checkSuccess) {
       console.log("Object check failed, not all params present");
        return false;
    }
        //now checking for existence
        //check if season exists
        if(is.object(this.season[seNum])) {
            //season exists
            //console.log('Season exists');
            if(is.object(this.season[seNum].episode[epNum])) {
                //episode exists
                console.log("Episode "+epNum+" of season "+seNum+" already exists. Overwriting!");
                //updating info
                this.updateEpisode(seNum,epNum,video);
            }
            else {
                //Season exists, episode doesn't exist, creating one
                console.log('Season exists, episode doesnt: creating one');
                this.createEpisode(seNum,epNum,video);
            }
        }
        //season doesn't exist
        else {
            //create season, then create episode
            console.log('Create season AND episode');
            this.season[seNum] = {};
            this.createEpisode(seNum,epNum,video);
        }
    return true;

};

module.exports = Series;