var Providers = {
    providersList : [['vk','oid'],['hls','moonwalk'],['youtube','youtu'],['rutube','rutube']],

    getProviderFromURL : function(url) {
        //okay, this is rather dumb, i know
        //@TODO: rewrite later (using brain)
        console.log("PROV:"+url);
        if(!url) return false;
        var i;
        for(i=0;i<this.providersList.length;i++) {
            if (url.indexOf(this.providersList[i][1]) >= 0) {
                return this.providersList[i][0];
            }
        }
        return false;
    }
}

module.exports = Providers;