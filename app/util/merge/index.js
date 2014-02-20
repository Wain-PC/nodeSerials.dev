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
            else if (isArray(obj1[p]) || isArray(obj2[p])) {
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
    if (obj1 === obj2) {
        console.log("Same");
        return obj1;
    }
    if (!isArray(obj1) && !isArray(obj1)) {
        console.log("Both not array, making one");
        return new Array(obj1, obj2);
    }

    if (isArray(obj1)) {
        if (isArray(obj2)) {
            //both are arrays
            console.log("Both are arrays, concatenating");
            return obj1.concat(obj2);
        }
        //only obj1 is array
        console.log("Only 1st is array" + obj1 + " " + obj2);
        obj1.push(obj2);
        return obj1;
    }
    else if (isArray(obj2)) {
        //only obj2 is array
        console.log("Only 2nd is array");
        return obj2.push(obj1);
    }
}


//@TODO: probably, this should be moved to util section as a commonly used function
function isArray(obj) {
    if (Object.prototype.toString.call(obj) === '[object Array]') {
        return true;
    }
    return false;
}

module.exports = merge;