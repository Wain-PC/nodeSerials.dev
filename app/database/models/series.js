module.exports = function (db, DataTypes) {
    var Series = db.define('Series',
        {
            title_ru: DataTypes.STRING,
            title_en: DataTypes.STRING,
            imdbid: DataTypes.INTEGER,
            kpid: DataTypes.INTEGER,
            thetvdbid: DataTypes.INTEGER,
            tvrageid: DataTypes.INTEGER,
            status: DataTypes.STRING,
            description: DataTypes.TEXT
        });

    return Series;
};