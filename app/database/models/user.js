module.exports = function (db, DataTypes) {
    var User = db.define('User',
        {
            key: DataTypes.STRING
        },
        {freezeTableName: true});

    return User;
};