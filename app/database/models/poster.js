module.exports = function (db, DataTypes) {
    var Poster = db.define('Poster',
        {
            url: {type: DataTypes.STRING}
        },
        {freezeTableName: true});

    return Poster;
};