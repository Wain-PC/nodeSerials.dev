module.exports =
{
    database: {
        name: 'admin_octopus',
        host: '173.44.34.162',
        login: 'admin_root',
        password: 'SghZcP88CM',
        /*name: 'nodeserials',
         host: 'localhost',
         login: 'root',
         password: '',*/
        forceClearOnStart: false,
        logging: false
    },
    http: {
        userAgent: {
            desktop: {
                opera: 'Opera/9.80 (Windows NT 6.0) Presto/2.12.388 Version/12.14',
                chrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1664.3 Safari/537.36',
                firefox: 'Mozilla/5.0 (Windows NT 6.0; WOW64; rv:24.0) Gecko/20100101 Firefox/24.0'
            },
            mobile: {
                android_hdserials: 'Android;HD Serials v.1.8.4;ru-RU;google Nexus 4;SDK 10;v.2.3.3(REL)'
            }
        }
    },
    parsers: {
        thetvdb: {
            api_key: '1F31F9C2BDB72379'
        }
    },
    rrx: {
        startWithApp: false,
        timeout: {
            checkQueue: 5,
            noRemoteDevices: 10,
            remoteDeviceResponse: 30,
            restartQueueIterations: 10
        }
    }
};