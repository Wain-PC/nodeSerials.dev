module.exports = function (app) {

    var Frontend = function (app) {
        var models = app.get('models');
        this.model = {};
        this.model.Series = models.Series;
        this.model.Season = models.Season;
        this.model.Episode = models.Episode;
        this.model.Video = models.Video;
        this.model.Poster = models.Poster;
        this.model.Genre = models.Genre;
        this.model.Person = models.Person;
        this.S = models.Sequelize;
    };

    Frontend.prototype.getLatestSeries = function (limit, callback) {
        var Series = this.model.Series;
        var res = [];
        Series.findAndCountAll({
            order: 'id DESC',
            limit: limit,
            include: [
                {model: this.model.Poster, as: 'Poster'}
            ]
        }).success(function (result) {
                callback(result.rows);
            });
    };

    Frontend.prototype.getSeriesById = function (id, callback) {

        this.model.Series.find({
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
                    ]},
                {model: this.model.Poster, as: 'Poster'}
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
                console.log("Output total of " + res.length + " items");
                response.send(res);
            }

        });
    });


    app.get("/api/search", function (request, response) {
        var query = decodeURIComponent(request.query.q);
        console.log("Q= " + query);
        var jsonOutput = (request.query.json == 1);
        var f = new Frontend(app);
        f.findSeriesByName(query, function (res) {
            if (!jsonOutput) {
                response.render('seriesList',
                    { dataArray: res, rawData: JSON.stringify(res)}
                );
            }
            else {
                console.log("Output total of " + res.length + " items");
                response.send(res);
            }
        });
    });

    app.get("/api/series/:id", function (request, response) {
        var f = new Frontend(app);
        var id = request.params.id;
        var jsonOutput = (request.query.json == 1);
        if (!id) {
            response.send({});
            return false;
        }
        f.getSeriesById(request.params.id, function (res) {
            if (!jsonOutput) {
                response.render('seriesList',
                    { dataArray: res, rawData: JSON.stringify(res)}
                );
            }
            else {
                console.log("Output series:" + res.title_ru);
                response.send(res);
            }
        });
    });

    //---------------------------
    //these are one-time methods for DB instantiation with data
    Frontend.prototype._addGenres = function () {
        var genreList = {
            "1": {
                "title_en": "Comedy",
                "title_ru": "Комедия"
            },
            "2": {
                "title_en": "Teens",
                "title_ru": "Молодежный"
            },
            "4": {
                "title_en": "Action",
                "title_ru": "Боевик"
            },
            "5": {
                "title_en": "Adventure",
                "title_ru": "Приключения"
            },
            "6": {
                "title_en": "Drama",
                "title_ru": "Драма"
            },
            "7": {
                "title_en": "Romance",
                "title_ru": "Романтика"
            },

            "9": {
                "title_en": "Sci-Fi",
                "title_ru": "Фантастика"
            },
            "10": {
                "title_en": "Family",
                "title_ru": "Семейный"
            },
            "11": {
                "title_en": "Talent",
                "title_ru": "Таланты"
            },
            "12": {
                "title_en": "Fantasy",
                "title_ru": "Фэнтези"
            },
            "18": {
                "title_en": "Children",
                "title_ru": "Детский"
            },
            "23": {
                "title_en": "Animation",
                "title_ru": "Анимация"
            },
            "25": {
                "title_en": "Mystery",
                "title_ru": "Детектив"
            },
            "26": {
                "title_en": "Thriller",
                "title_ru": "Триллер"
            },
            "27": {
                "title_en": "Military",
                "title_ru": "Военный"
            },
            "28": {
                "title_en": "Crime",
                "title_ru": "Криминал"
            },
            "29": {
                "title_en": "Anime",
                "title_ru": "Аниме"
            },
            "30": {
                "title_en": "Horror",
                "title_ru": "Ужасы"
            },
            "31": {
                "title_en": "Soaps",
                "title_ru": "Мыльная опера"
            },
            "32": {
                "id": 32,
                "title_en": "Music",
                "title_ru": "Музыкальный"
            },
            "33": {
                "title_en": "Science",
                "title_ru": "Научный"
            },
            "34": {
                "title_en": "Lifestyle",
                "title_ru": "Стиль жизни"
            },
            "35": {
                "title_en": "Medical",
                "title_ru": "Медицинский"
            },
            "36": {
                "title_en": "Politics",
                "title_ru": "Политика"
            },
            "37": {
                "title_en": "Celebrities",
                "title_ru": "Знаменитости"
            },
            "38": {
                "title_en": "Dance",
                "title_ru": "Танцевальный"
            },
            "39": {
                "title_en": "Western",
                "title_ru": "Вестерн"
            },
            "40": {
                "title_en": "Automobiles",
                "title_ru": "Автомобильный"
            },
            "41": {
                "title_en": "Anthology",
                "title_ru": "Антология"
            },
            "43": {
                "title_en": "Educational",
                "title_ru": "Образовательный"
            },
            "44": {
                "title_en": "Sports",
                "title_ru": "Спортивный"
            },
            "45": {
                "title_en": "History",
                "title_ru": "Исторический"
            },
            "46": {
                "title_en": "Cartoons",
                "title_ru": "Мультфильмы"
            },
            "50": {
                "title_en": "Travel",
                "title_ru": "Путешествия"
            },
            "52": {
                "title_en": "Religion",
                "title_ru": "Религия"
            },
            "54": {
                "title_en": "Interview",
                "title_ru": "Интервью"
            },
            "56": {
                "title_en": "Cooking/Food",
                "title_ru": "Кулинария"
            },
            "57": {
                "title_en": "Fashion",
                "title_ru": "Мода"
            },
            "63": {
                "title_en": "How To/Do It Yourself",
                "title_ru": "Сделай сам"
            },
            "69": {
                "title_en": "Design/Decorating",
                "title_ru": "Дизайн"
            },
            "70": {
                "title_en": "Animals",
                "title_ru": "Животные"
            },
            "75": {
                "title_en": "Arts",
                "title_ru": "Искусство"
            },
            "82": {
                "title_en": "Garden/Landscape",
                "title_ru": "Пейзажи"
            },
            "93": {
                "title_en": "Documentary",
                "title_ru": "Документальный"
            }
        };
        var Genre = this.model.Genre;
        var genre;
        for (var i = 0; i < 100; i++) {
            genre = genreList[i];
            if (!genre) continue;

            Genre.create({
                title_ru: genre.title_ru,
                title_en: genre.title_en
            }).success(function (genre) {
                    console.log("Added genre " + genre.values.title_ru);
                });
        }
    }


    Frontend.prototype._setSimilar = function () {
        var Genre = this.model.Genre;
        var genre, similarArr, i, j;

        var similarGenresArray = [
            [2, 3, 4, 8],
            [4, 6],
            [4, 7, 10, 13, 14, 15, 16],
            [],
            [6, 8],   //5
            [1, 2, 8],
            [],
            [],
            [25, 26, 20, 44],
            [7], //10
            [12, 17, 33],
            [],
            [],
            [],
            [3, 44], //15
            [],
            [],
            [],
            [],
            [], //20
            [],
            [],
            [],
            [],
            [], //25
            [],
            [],
            [],
            [],
            [], //30
            [],
            [],
            [],
            [],
            [], //35
            [],
            [],
            [],
            [],
            [], //40
            [],
            [],
            [],
            [] //44
        ];

        Genre.findAndCountAll().success(function (genreList) {
            genreList = genreList.rows; //should be 44 rows currently
            console.log("TOTAL:" + genreList.length);
            for (i = 0; i < genreList.length; i++) {
                genre = genreList[i];
                similarArr = [];
                for (j = 0; j < similarGenresArray[i].length; j++) {
                    similarArr.push(genreList[j]);
                }
                if (!similarArr.length) continue; //continue if no similar genres defined
                console.log("Assigning " + similarArr.length + " genres to genre " + genre.title_ru);
                genre.setSimilar(similarArr).success(function (similarGenres) {
                    //do nothing, updated
                });
            }
        });
    }

    app.get("/api/setgenres", function (request, response) {
        var f = new Frontend(app);
        f._addGenres();
    });

    app.get("/api/setsimilargenres", function (request, response) {
        var f = new Frontend(app);
        f._setSimilar();
    });

}