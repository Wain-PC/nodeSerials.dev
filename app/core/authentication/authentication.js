var Authentication = {

    checkKey: function (key, callback) {
        var models = require('../../database/models'),
            sequelize = models.sequelize,
            S = models.Sequelize;

        if (!key) {
            callback(false);
            return false;
        }

        var User = models.User;
        User.find({where: {
            key: key
        }})
            .success(function (user) {
                if (user && user.values.id != 0) {
                    console.log("User found:" + user.values.id);
                    callback(true);
                    return true;
                }
                callback(false);
                return false;
            })

    },

    initializeKey: function (callback) {
        try {
            var models = require('../../database/models'),
                crypto = require('crypto'),
                User,
                buf,
                key,
                sha;

            User = models.User;
            buf = crypto.randomBytes(128);
            sha = crypto.createHash('sha1');
            key = sha.update(buf);
            key = sha.digest('hex');

            //add key to database
            User.create({
                key: key
            }).success(function (user) {
                    callback(user.values.key);
                    return true;
                })

        } catch (err) {
            console.log(err);
            callback(false);
            return false;
        }

    }
};

module.exports = Authentication;
