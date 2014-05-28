var Frontend = function (app) {
    var models = app.get('models');
    this.app = app;
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


//--------Deferred request API

Frontend.prototype.provideDeferredRequestData = function (callback) {
    var Q = this.app.get('queue');
    Q.pull(function (item) {
        callback(item);
    });
};

//--------Deferred request API end


//-----------Search API

Frontend.prototype.findSeriesByName = function (name, callback) {
    var Series = this.model.Series;

    Series.findAndCountAll({
        where: this.S.or(
            ["title_ru LIKE ?", '%' + name + '%'],
            ["title_en LIKE ?", '%' + name + '%']
        ),
        include: [
            {model: this.model.Poster, as: 'Poster'}
        ]
    }).success(function (result) {
            callback(result.rows);
        });
};


Frontend.prototype.findPeopleByName = function (name, callback) {
    var People = this.model.Person;

    People.findAndCountAll({
        where: ["name_ru LIKE ?", '%' + name + '%']
    }).success(function (result) {
            callback(result.rows);
        });
};


//-----------Search API END


//-----------Common API

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
                    ]
                }
                ,
                {model: this.model.Poster, as: 'Poster'}
                ,
                {model: this.model.Genre, as: 'Genres'}
                //,   //model disabled as being WAY TOO HEAVY on load time
                //{model: this.model.Person, as: 'Person'}
            ], order: [
                [
                    {model: this.model.Season, as: 'Season'},
                    'number'
                ],
                [
                    {model: this.model.Season, as: 'Season'},
                    {model: this.model.Episode, as: 'Episode'},
                    'number'
                ]
            ]

        }
        //,{ raw: true } //speedUP!
    ).success(function (series) {
            if (!series || series.length == 0) {
                callback(null);
                return false;
            }
            callback(series);
        });
};


Frontend.prototype.getLatestSeries = function (limit, callback) {
    var Series = this.model.Series;
    var res = [];
    Series.findAll({
        limit: limit,
        order: [
            ['updatedAt', 'DESC']
        ],
        include: [
            {model: this.model.Poster, as: 'Poster'}
        ]
    }).success(function (result) {
            callback(result);
        });
};

Frontend.prototype.getGenres = function (callback) {
    var Genre = this.model.Genre;
    Genre.findAndCountAll({
        order: 'title_ru'
    }).success(function (result) {
            callback(result.rows);
        });
};


Frontend.prototype.getGenreSeriesById = function (id, number, offset, callback) {

    var _this = this;
    var Genre = this.model.Genre;
    var Poster = this.model.Season;

    Genre.find({
        where: {
            id: id
        }
    }).success(function (genre) {
            if (!genre) {
                callback([]);
                return false;
            }
            ;
            genre.getSeries({
                // include: [Poster] //SHIT DOESN'T WORK
            }).success(function (seriesArray) {
                    callback({series: seriesArray, genre: genre});
                    return true;
                });
        });

};


Frontend.prototype.getSeriesByAplhabet = function (letter, callback) {
    var Series = this.model.Series;
    Series.findAndCountAll({
        where: ["title_ru LIKE ?", letter + '%'],
        include: [
            {model: this.model.Poster, as: 'Poster'}
        ],
        order: 'title_ru'
    }).success(function (result) {
            callback(result.rows);
        });
};


//-----------Common API END


//-----------People API
Frontend.prototype.getPersonSeries = function (id, callback) {
    var People = this.model.Person;

    People.find({
        where: {
            id: id
        },
        include: [
            {model: this.model.Series, as: 'Series'}
        ]

    }).success(function (result) {
            callback(result);
        });
};

//-----------End People API

//---------------------------
//these are one-time methods for DB instantiation with data
Frontend.prototype._addGenres = function (callback) {
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

        Genre.findOrCreate({
            title_ru: genre.title_ru,
            title_en: genre.title_en
        }).success(function (genre) {
                console.log("Added genre " + genre.values.title_ru);
            });
    }
}


Frontend.prototype._setSimilar = function (callback) {
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
                callback(similarGenres);
            });
        }
    });
};


//exporting Frontend
module.exports = Frontend;
