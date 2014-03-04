module.exports = function (app) {

    var Frontend = function (app) {
        var models = app.get('models');
        this.model = {};
        this.model.Series = models.Series;
        this.model.Season = models.Season;
        this.model.Episode = models.Episode;
        this.model.Video = models.Video;
        this.S = models.Sequelize;
    };

    Frontend.prototype.getLatestSeries = function (limit, callback) {
        var Series = this.model.Series;
        var res = [];
        Series.findAndCountAll({
            order: 'id DESC',
            limit: limit
        }).success(function (result) {
                callback(result.rows);
            });
    };

    Frontend.prototype.getSeriesById = function (id, callback) {
        var Series = this.model.Series;
        var Season = this.model.Season;
        var Episode = this.model.Episode;
        var Video = this.model.Video;


        Series.find({
            where: {
                id: id
            },
            include: [
                {model: this.model.Season, as: 'Season',
                    include: [
                        {model: this.model.Episode, as: 'Episode',
                            include: [
                                {model: this.model.Video, as: 'Video'}
                            ]}
                    ]}
            ]
        }).success(function (series) {
                console.log(series.season[0].episode[0].values);
                callback(series.values);
            });
    };


    Frontend.prototype.findSeriesByName = function (name, callback) {
        var Series = this.model.Series;

        Series.findAndCountAll({
            where: this.S.or(
                ["title_ru LIKE ?", '%' + name + '%'],
                ["title_en LIKE ?", '%' + name + '%']
            )
        }).success(function (result) {
                console.log(result);
                callback(result.rows);
            });
    }


    //check for valid key when using API
    var auth = require('../authentication');

    app.all('/api/acquirekey', function (req, res) {
        auth.initializeKey(function (key) {
            if (!key) {
                res.end('Key was NOT created, sorry =(');
                return false;
            }
            //success
            res.end(key);
            return true;
        });
    });

    /*app.all('/api*/
    /*', function (req, res, next) {
     var key = req.query.key;
     auth.checkKey(key, function (result) {
     if (result) {
     next();
     return true;
     }
     res.send(403, 'key not provided or not valid');
     });
     });*/

    app.get("/api/latest", function (request, response) {
        var f = new Frontend(app);
        var jsonOutput = (request.query.json == 1);
        f.getLatestSeries(100, function (res) {
            if (!jsonOutput) {
                response.render('seriesList',
                    { dataArray: res, rawData: JSON.stringify(res)}
                );
            }
            else {
                console.log(JSON.stringify(res));
                response.send(res);
            }

        });
    });


    app.get("/api/search", function (request, response) {
        var query = decodeURIComponent(request.query.q);
        console.log("Q=" + query);
        var f = new Frontend(app);
        f.findSeriesByName(query, function (res) {
            response.render('seriesList',
                { dataArray: res, rawData: JSON.stringify(res)}
            );
        });
    });

    app.get("/api/series/:id", function (request, response) {
        var f = new Frontend(app);
        var id = request.params.id;
        if (!id) return false;
        f.getSeriesById(request.params.id, function (res) {
            response.render('series',
                { series: res }
            );
        });
    });

}