module.exports = function (db, DataTypes) {
    var Person = db.define('Person',
        {
            name_ru: DataTypes.STRING
        },
        {freezeTableName: true});

    return Person;
};