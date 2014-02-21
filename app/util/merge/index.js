var is = require('../is');

function merge(obj2) {
    var obj1 = this;

    for (var p in obj2) {
        try {
            // Property in destination object set; update its value.
            if (obj2[p].constructor == Object) {
                obj1[p].merge = merge;
                obj1[p].merge(obj2[p]);

            }
            //if one of the props is an array, join the values to bigger array
            else if (is.array(obj1[p]) || is.array(obj2[p])) {
                obj1[p] = mergeMultiple(obj1[p], obj2[p]);
            }
            else {
                obj1[p] = obj2[p];

            }

        } catch (e) {
            // Property in destination object not set; create it and set its value.
            obj1[p] = obj2[p];

        }
    }

    return obj1;
}

function mergeMultiple(obj1, obj2) {
    if (obj1 === obj2) return obj1;
    if (!is.array(obj1) && !is.array(obj1)) return new Array(obj1, obj2);

    if (is.array(obj1)) {
        if (is.array(obj2)) {
            //both are arrays
            return obj1.concat(obj2);
        }
        //only obj1 is array
        obj1.push(obj2);
        return obj1;
    }
    else if (is.array(obj2)) {
        //only obj2 is array
        return obj2.push(obj1);
    }
}


module.exports = merge;