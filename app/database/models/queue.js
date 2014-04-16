module.exports = function (db, DataTypes) {
    var Queue = db.define('Queue',
        {
            url: DataTypes.STRING,
            type: DataTypes.STRING, //either POST or GET
            userAgent: DataTypes.STRING, //in some cases, USER_AGENT is necessary for making a correct request
            params: DataTypes.STRING // other params, such as POST values string @TODO: 255 symbols restriction is enough?
        },
        {freezeTableName: true});

    return Queue;
};