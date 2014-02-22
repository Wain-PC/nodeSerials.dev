module.exports = function () {
    var a = arguments,
        l = a.length,
        a1, a2,
        counter = 0;
    var mode = {
        and: 'AND',
        or: 'OR'
    };

    if (!l || l % 2) {
        console.log("Cannot compare args, no args or number not even");
        return false;
    }

    for (var i = 0; i < l; i += 2) {
        a1 = a[i];
        a2 = a[i + 1];


        if ((typeof a1 == 'string') && (typeof a2 == 'string')) {
            //lowercasing
            a1 = a1.toLowerCase();
            a2 = a2.toLowerCase();

            //stripping possible 'the' and year like (2014) at the end
            var re = /^(?:the )?(.+?)(?:[!?]?)(?: \(\d{4}\))?$/;
            a1 = a1.replace(re,"$1");
            a2 = a2.replace(re,"$1");
        }

        console.log("Compairing " + a1 + ' ' + a2);
        if ((a1 || a2) && (a1 == a2)) {
            counter++;
            break;
        }
    }
    //AND mode: all comparisons were successful
    //if(counter == l/2) return true;

    //OR mode (default): at least 1 comparison was successful
    if (counter) return true;
    return false;
}