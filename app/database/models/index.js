var Sequelize = require('sequelize');
var config = require('../../core/config');
var credits = {
    protocol: 'mysql',
    host: config.database.host,
    user: config.database.login,
    password: config.database.password,
    database: 'nodeserials'
};

// initialize database connection
var connectionString = 'mysql://' + credits.user + ':' + credits.password + '@' + credits.host + '/' + credits.database;
var sequelize = new Sequelize(connectionString, {logging: false});


// load models
var models = [
    'Series',
    'Season',
    'Episode',
    'Video'
];
models.forEach(function (model) {
    module.exports[model] = sequelize.import(__dirname + '/' + model);
});

// describe relationships
(function (m) {
    m.Series.hasMany(m.Season, {as: 'Seasons'});
    m.Season.belongsTo(m.Series, {as: 'Series'});

    m.Season.hasMany(m.Episode, {as: 'Episodes'});
    m.Episode.belongsTo(m.Season, {as: 'Season'});

    m.Episode.hasMany(m.Video, {as: 'Videos'});
    m.Video.belongsTo(m.Episode, {as: 'Episode'});
})(module.exports);

//sync database
sequelize.sync()
    .success(function () {
        console.log("Sync success!");
    })
    .error(function (err) {
        console.log("Sync error!" + err);
    });

// export connection
module.exports.sequelize = sequelize;