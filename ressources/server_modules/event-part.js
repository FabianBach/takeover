
// this part is used to augment modules with an event handler
// TODO: overthink the scope param (this) and possible attributes, such as event info and so on

var eventhandler = function(){

    var that = {},
        events = {};

    function on(eventName, callback, scope){
        if(typeof (callback) !== 'function') return;
        events[eventName] = events[eventName] || [];
        events[eventName].push({
            fn: callback,
            scp: scope || null
        });
    }

    function fire(eventName){
        var functions = events[eventName] || [];
        //we will step through this array in reverse to call last assigned listeners first
        for( var i = functions.length-1; i >= 0; i--){

            var func = functions[i].fn,
                scope = functions[i].scp,
                args = Array.prototype.slice.call(arguments); // make it a real array

            args = args.slice(1); // get rid of the first argument eventName

            // will invoke with scope and possible arguments given to fire()
            // break if any callback returns false
            var doContinue = func.call(scope, args);
            if(!doContinue && doContinue !== undefined) break;
        }
    }

    that.on = on;
    that.fire = fire;

    return that;
};


// creates a new handler and returns it
module.exports = eventhandler;