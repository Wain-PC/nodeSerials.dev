module.exports = function (db, DataTypes) {
    var Person = db.define('Person',
        {
            name_ru: {type: DataTypes.STRING, unique: true}
        },
        {freezeTableName: true});

    return Person;
};