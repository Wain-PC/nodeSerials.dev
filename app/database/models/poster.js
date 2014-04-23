module.exports = function (db, DataTypes) {
    var Poster = db.define('Poster',
        {
            url: {type: DataTypes.STRING, unique: true}
        },
        {freezeTableName: true});

    return Poster;
};