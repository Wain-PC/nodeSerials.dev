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
    },

    russian: function (n) {
        return Is.string(n) && /[А-ЯЁ]/gi.test(n);
    },

    imageURL: function (url) {
        return this.string(url) && /^https?:\/\/(?:[a-z\-]+\.)+[a-z]{2,6}(?:\/[^/#?]+)+\.(?:jpg|jpeg|png)$/i.test(url);
    }
};

module.exports = Is;

