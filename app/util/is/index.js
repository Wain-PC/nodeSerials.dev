var Is =  {
    number : function (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
    },

array : function (n) {
    if (Object.prototype.toString.call(n) === '[object Array]') {
        return true;
    }
    return false;
}
};

module.exports = Is;

