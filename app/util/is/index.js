var Is = {
    number: function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    },

    array: function (n) {
        return (Object.prototype.toString.call(n) === '[object Array]');
    },

    string: function (n) {
        return (typeof n == 'string' || n instanceof String);
    },

    object: function (n) {
        return (Object.prototype.toString.call(n) === '[object Object]');
    },

    function: function (n) {
        return (typeof(n) === 'function');
    }
};

module.exports = Is;

