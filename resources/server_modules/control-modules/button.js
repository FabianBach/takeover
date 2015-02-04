
var button = function(config, shared){

    shared = shared || {};

    // this object inherits from the abstract object
    var that = require('./_abstract-module.js');
    that = that(config, shared);

    return that;
};

module.exports = button;

// nice logging
require('colors');