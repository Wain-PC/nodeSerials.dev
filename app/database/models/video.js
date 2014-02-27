module.exports = function (db, DataTypes) {
    var Video = db.define('Video',
        {
            title: DataTypes.STRING,
            url: DataTypes.STRING,
            type: DataTypes.STRING,
            source: DataTypes.STRING
        });

    return Video;
};