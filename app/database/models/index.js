var Sequelize = require('sequelize');
var config = require('../../core/config');
var credits = {
    protocol: 'mysql',
    host: config.database.host,
    user: config.database.login,
    password: config.database.password,
    database: config.database.name
};

// initialize database connection
var connectionString = 'mysql://' + credits.user + ':' + credits.password + '@' + credits.host + '/' + credits.database;
var sequelize = new Sequelize(connectionString, {logging: false});


// load models from the following list
var models = [
    'Series',
    'Season',
    'Episode',
    'Video',
    'User',
    'Poster',
    'Genre',
    'Person',
    'Queue'
];
models.forEach(function (model) {
    module.exports[model] = sequelize.import(__dirname + '/' + model);
});

// describe relationships between models
(function (m) {

    m.Series.hasMany(m.Genre);
    m.Genre.hasMany(m.Series);
    m.Genre.hasMany(m.Genre, {as: 'Similar', through: 'SimilarGenre'});

    m.Series.hasMany(m.Person, { as: 'Person', through: 'SeriesPeople'});
    m.Person.hasMany(m.Series, {as: 'Series', through: 'SeriesPeople'});

    m.Series.hasMany(m.Poster, {as: 'Poster'});
    m.Poster.belongsTo(m.Series, {as: 'Series'});

    m.Series.hasMany(m.Season, {as: 'Season'});
    m.Season.belongsTo(m.Series, {as: 'Series'});

    m.Season.hasMany(m.Episode, {as: 'Episode'});
    m.Episode.belongsTo(m.Season, {as: 'Season'});

    m.Episode.hasMany(m.Video, {as: 'Video'});
    m.Video.belongsTo(m.Episode, {as: 'Episode'});

})(module.exports);

//sync database
var forceSync = !!((require('../../core/config')).database.forceClearOnStart);

console.log("FS:" + forceSync);

sequelize.sync(forceSync ? {force: true} : null)
    .success(function () {
        console.log("Sync success!");
    })
    .error(function (err) {
        console.log("Sync error!" + err);
    });

// export connection
module.exports.sequelize = sequelize;
module.exports.Sequelize = Sequelize;