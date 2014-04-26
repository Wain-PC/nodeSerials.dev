module.exports = function (db, DataTypes) {
    var Queue = db.define('Queue',
        {
            url: DataTypes.STRING,
            type: DataTypes.STRING, //either POST or GET
            userAgent: DataTypes.STRING, //in some cases, USER_AGENT is necessary for making a correct request
            params: DataTypes.TEXT, // other params, such as POST values string
            status: DataTypes.STRING, //can be one of the following: 'new' - waiting to be used, 'sent' - sent to the remote device for execution
            requestId: {type: DataTypes.STRING, unique: true } //unique sha1 hash of random bytes. Calculated for each request.
        },
        {freezeTableName: true});

    return Queue;
};