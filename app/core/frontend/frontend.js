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
            limit: 10
        }).success(function (result) {
                console.log(result.rows[0].values);
                for (var i = 0; i < result.rows.length; i++) {
                    res.push({
                        title: result.rows[i].values.title_ru,
                        url: '#'
                    });
                }
                callback(res);
            });
    }

    app.get("/frontend/latest", function (request, response) {
        var f = new Frontend(app);
        f.getLatestSeries(10, function (res) {
            response.render('genreList',
                { dataArray: res, rawData: JSON.stringify(res)}
            );
        });
    });

}