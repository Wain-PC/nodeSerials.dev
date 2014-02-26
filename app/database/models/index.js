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
var sequelize = new Sequelize(connectionString);


// load models
var models = [
    'Series',
    'Season'
];
models.forEach(function (model) {
    module.exports[model] = sequelize.import(__dirname + '/' + model);
});

// describe relationships
(function (m) {
    m.Series.hasMany(m.Season, {as: 'Seasons'});
})(module.exports);

// export connection
module.exports.sequelize = sequelize;