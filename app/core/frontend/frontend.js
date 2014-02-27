module.exports = function (app) {

    var Frontend = function (app) {

        this.getApp = function () {
            return app;
        };

        //this is private in order not to let access database directly from the outside
        var models = this.getApp().get('models');

        this.getModels = function () {
            return models;
        };
    };

    Frontend.prototype.getLatestSeries = function (limit, callback) {
        var Series = this.getModels().Series;
        var res = [];
        Series.findAndCountAll({
            order: 'id DESC',
            limit: 10
        }).success(function (result) {
                callback(result.rows);
            });
    };

    Frontend.prototype.getSeriesById = function (id, callback) {
        var Series = this.getModels().Series;
        var Season = this.getModels().Season;
        var Episode = this.getModels().Episode;
        var Video = this.getModels().Video;


        Series.find({
            where: {
                id: id
            },
            include: [
                {model: Season, as: 'Seasons',
                    include: [
                        {model: Episode, as: 'Episodes',
                            include: [
                                {model: Video, as: 'Videos'}
                            ]}
                    ]}
            ]
        }).success(function (series) {
                console.log(series.seasons[0].episodes[0].values);
                callback(series.values);
            });
    }

    app.get("/frontend/latest", function (request, response) {
        var f = new Frontend(app);
        f.getLatestSeries(10, function (res) {
            response.render('seriesList',
                { dataArray: res, rawData: JSON.stringify(res)}
            );
        });
    });

    app.get("/frontend/series/:id", function (request, response) {
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