module.exports = function (db, DataTypes) {
    var Season = db.define('Season',
        {
            number: DataTypes.INTEGER,
            status: DataTypes.STRING,
            description: DataTypes.TEXT
        },
        {freezeTableName: true});

    return Season;
};