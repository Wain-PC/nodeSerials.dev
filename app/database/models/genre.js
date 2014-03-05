module.exports = function (db, DataTypes) {
    var Genre = db.define('Genre',
        {
            title_ru: DataTypes.STRING,
            title_en: DataTypes.STRING
        },
        {freezeTableName: true});

    return Genre;
};