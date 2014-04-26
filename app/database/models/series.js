module.exports = function (db, DataTypes) {
    var Series = db.define('Series',
        {
            title_ru: DataTypes.STRING,
            title_en: DataTypes.STRING,
            imdbid: {type: DataTypes.INTEGER, defaultValue: 0},
            kpid: {type: DataTypes.INTEGER, defaultValue: 0},
            thetvdbid: {type: DataTypes.INTEGER, defaultValue: 0},
            tvrageid: {type: DataTypes.INTEGER, defaultValue: 0},
            status: DataTypes.STRING,
            description: DataTypes.TEXT
        },
        {freezeTableName: true});

    return Series;
};