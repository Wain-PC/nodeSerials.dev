module.exports = function (db, DataTypes) {
    var Queue = db.define('Queue',
        {
            url: DataTypes.STRING,
            params: DataTypes.STRING //@TODO: 255 symbols restriction
        },
        {freezeTableName: true});

    return Queue;
};