var Providers = {
    providersList: [
        ['vk', 'oid'],
        ['hls', 'moonwalk'],
        ['youtube', 'youtu'],
        ['rutube', 'rutube']
    ],

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

    getDirectVideoURL: function (video, callback) {
        if (!video || !callback) return false;
        var retURL,
            url = video.url,
            type = video.type;

        if (url.search('vk.com') != -1) {

            getVideoLink(retURL, function (video_url) {
                debug("LINK:" + video_url);
                if (callback) callback(video_url);
                return true;
            });
        }


        else if (url.search('moonwalk') != -1) {
            debug("MW");
            getVideoLink(code, function (video_url) {
                if (callback) callback(video_url);
                return true;
            });
        }

        else if (url.search(/\.(3gp|aac|f4v|flv|m4a|mp3|mp4)/i) != -1) {
            callback(url);
            return true;
        }

        else if (url.search(/video\.rutube\.ru/i) != -1) {
            code = code.replace(/^.*?(http:[^"]+).*?$/, '$1');
            callback(url);
        }

        else if (code.search('youtu') != -1) {
            //youtube video
            retURL = code.match(/.*youtube.*\/embed\/([\S]*)\?autoplay/)[1];
            debug('YOUTUBE!: ' + retURL);
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

function getVideoLink(url, callback) {
    var result_url = url,
        fname;
    RqGet.makeRequest(url, false, function (error, response, v) {

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
                    console.log(video_no_flv);

                }
                catch (err) {
                    console.log("Error while getting video:" + err.message);
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
                    result_url = video_host + "u" + video_uid + "/videos/" + video_vtag + "." + fname;
                } else {
                    var vkid = v.match("vkid=(.*)&" [1]);
                    fname = "vk.flv";
                    result_url = "http://" + video_host + "/assets/videos/" + video_vtag + vkid + "." + fname;
                }
                if (callback) callback(result_url);

            }
            //endif
            else {
                //hdserials video (moonwalk.cc load balancer)
                var video_token = /video_token: '(.+?)'/.exec(v)[1];
                var video_secret = /video_secret: '(.+?)'/.exec(v)[1];
                console.log("VIdeo_token:" + v);
                RqPost.makeRequest('http://moonwalk.cc/sessions/create_session', {video_token: video_token, video_secret: video_secret}, function (error, response, resJSON) {
                    resJSON = JSON.parse(resJSON);
                    result_url = 'hls:' + resJSON.manifest_m3u8;
                    if (callback) callback(result_url);
                });


            }
            //end else

        },
        {
            headers: {
                'User-Agent': 'Opera/9.80 (Windows NT 6.0) Presto/2.12.388 Version/12.14'
            }
        });
}

module.exports = Providers;