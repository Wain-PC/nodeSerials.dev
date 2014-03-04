module.exports = function (db, DataTypes) {
    var Poster = db.define('Poster',
        {
            url: DataTypes.STRING
        },
        {freezeTableName: true});

    return Poster;
};