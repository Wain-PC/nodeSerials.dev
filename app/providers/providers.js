var Providers = {
    providersList: [
        ['vk', 'oid'],
        ['hls', 'moonwalk'],
        ['youtube', 'youtu'],
        ['rutube', 'rutube']
    ],


    getDirectLink: function (app, url, callback) {
        var Request = require('../util/request');
        var rqGet = new Request(app);
        var type = this.getProviderFromURL(url);
        console.log("Type of link acquired:" + type);
        if (!type) {
            callback(false);
            return false;
        }
        this.getDirectVideoURL(rqGet, {
            type: type,
            url: url
        }, callback);
    },

    getProviderFromURL: function (url) {
        //okay, this is rather dumb, i know
        //@TODO: rewrite later (using brain)
        if (!url) return false;
        var i;
        for (i = 0; i < this.providersList.length; i++) {
            if (url.indexOf(this.providersList[i][1]) >= 0) {
                return this.providersList[i][0];
            }
        }
        return false;
    },

    getDirectVideoURL: function (request, video, callback) {
        if (!video || !callback) return false;
        var retURL,
            url = video.url,
            type = video.type;

        if ((url.search('vk.com') != -1) || (url.search('vkontakte.ru')) != -1) {

            getVideoLink(request, url, function (video_url) {
                console.log("LINK:" + video_url);
                if (callback) callback(video_url);
                return true;
            });
        }


        else if (url.search('moonwalk') != -1) {
            console.log("MW");
            getVideoLink(request, url, function (video_url) {
                if (callback) callback(video_url);
                return true;
            });
        }

        else if (url.search(/\.(3gp|aac|f4v|flv|m4a|mp3|mp4)/i) != -1) {
            callback(url);
            return true;
        }

        else if (url.search(/video\.rutube\.ru/i) != -1) {
            //url = url.replace(/^.*?(http:[^"]+).*?$/, '$1');
            callback(url);
        }

        else if (url.search('youtu') != -1) {
            //youtube video
            retURL = url.match(/.*youtube.*\/embed\/([\S]*)\?autoplay/)[1];
            console.log('YOUTUBE!: ' + retURL);
            retURL = 'http://youtube.com/watch?v=' + retURL;
            callback(retURL);
            return true;
        }
        else {
            callback(false);
            return false;
        }
    }

};

function getVideoLink(request, url, callback) {
    var result_url = url,
        fname;
    request.makeRequest(url, false, function (error, response, v) {

        if ((url.indexOf("vk.com") > 0) || (url.indexOf("/vkontakte.php?video") > 0) || (url.indexOf("vkontakte.ru/video_ext.php") > 0) || (url.indexOf("/vkontakte/vk_kinohranilishe.php?id=") > 0)) {
            //vk.com video
            if (v.match('This video has been removed from public access.')) {
                result_url = v.match('This video has been removed from public access.');
                return result_url;
            }

            try {
                var video_host = v.match("var video_host = '(.+?)';")[1];
                var video_uid = v.match("var video_uid = '(.*)'")[1];
                var video_vtag = v.match("var video_vtag = '(.*)'")[1];
                var video_no_flv = v.match("video_no_flv =(.*);")[1];
                var video_max_hd = v.match("var video_max_hd = '(.*)'")[1];
                var extra = v.match(/extra=(.*?)("|&amp)/)[1];
                console.log("Extra")

            }
            catch (err) {
                console.log("Error while getting video:" + err.message);
                callback(false);
                return false;
            }

            if (video_no_flv == 1) {
                switch (video_max_hd) {
                    case "0":
                        fname = "240.mp4";
                        break;
                    case "1":
                        fname = "360.mp4";
                        break;
                    case "2":
                        fname = "480.mp4";
                        break;
                    case "3":
                        fname = "720.mp4";
                        break;
                }
                result_url = video_host + "u" + video_uid + "/videos/" + video_vtag + "." + fname + "?extra=" + extra;
            } else {
                var vkid = v.match("vkid=(.*)&" [1]);
                fname = "vk.flv";
                result_url = "http://" + video_host + "/assets/videos/" + video_vtag + vkid + "." + fname + "?extra=" + extra;
            }
            if (callback) callback(result_url);

        }
        //endif
        else {
            //hdserials video (moonwalk.cc load balancer)
            var video_token = /video_token: '(.+?)'/.exec(v)[1];
            var video_secret = /video_secret: '(.+?)'/.exec(v)[1];
            request.TYPE = 'POST'; //on-the-fly request type change. Pretty bad idea, by the way...
            request.makeRequest('http://moonwalk.cc/sessions/create_session', {video_token: video_token, video_secret: video_secret}, function (error, response, resJSON) {
                resJSON = JSON.parse(resJSON);
                result_url = resJSON.manifest_m3u8;
                fixCORS(result_url, request, callback);
                //if (callback) callback(result_url);
            });


        }
        //end else

    });
}

function fixCORS(m3u8Url, request, callback) {
    var M3U8 = require('m3u8');
    var Stream = require('stream');
    var stream = new Stream();
    var fs = require('fs');
    var crypto = require('crypto');

    var file = fs.createReadStream('./web/static/index.m3u8');
    request.TYPE = 'GET'; //on-the-fly request type change.
    request.makeRequest(m3u8Url, false, function (err, resp, body) {

        var parser = M3U8.createStream();
        stream.pipe(parser);

        parser.on('item', function (item) {
            console.log("ITEM:" + item.toString());
            var url = item.get('uri');
            var re = /^.*(tracks.*?m3u8)$/g;
            var reFull = /^http:.*(tracks.*?m3u8)$/g;
            var fullUrlFound = reFull.exec(url);
            console.log("URIIIII FOUND:" + fullUrlFound);
            if (fullUrlFound) {
                item.set('uri', 'http://octopustv.ru:1234/' + url);
            }
            else {
                //assume that it's short URL
                //we must make a long proxied one out of it
                //OR DO NOTHING?!
                //item.set('uri', 'http://nodeserials.dev:1234/' + url);
            }
        });

        parser.on('m3u', function (m3u) {
            //generating playlist hashname (should be pretty unique)
            var sha = crypto.createHash('sha1');
            var buf = crypto.pseudoRandomBytes(128);
            sha.update(buf);
            var name = sha.digest('hex');


            fs.writeFile("./web/static/cors/" + name + ".m3u8", m3u.toString(), function (err) {
                if (err) {
                    console.log("Error creating playlist file:" + err);

                } else {
                    var retUrl = 'http://octopustv.ru:1337/cors/' + name + '.m3u8';
                    //remove the file after some time
                    setTimeout(function () {
                        fs.unlink("./web/static/cors/" + name + ".m3u8", function (err) {
                            if (err) {
                                console.log("Unlink error of file " + name + " :" + err);
                            }
                            else {
                                console.log("Unlink success for file " + name);
                            }
                        });
                    }, 600000);

                    callback(retUrl);
                }
            })
        });

        stream.emit('data', body);
        stream.emit('end');


    });

}

module.exports = Providers;