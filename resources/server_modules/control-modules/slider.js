
var slider = function(config, shared){

    shared = shared || {};

    // this object inherits from the abstract object
    var that = require('./_abstract-module.js');
    that = that(config, shared);

    return that;
};

module.exports = slider;

// nice logging
require('colors');