module.exports = function (db, DataTypes) {
    var Episode = db.define('Episode',
        {
            number: DataTypes.INTEGER,
            title: DataTypes.STRING,
            duration: DataTypes.INTEGER,
            air_date: DataTypes.DATE,
            status: DataTypes.STRING,
            description: DataTypes.TEXT,
            thumbnail: DataTypes.STRING
        },
        {freezeTableName: true});

    return Episode;
};