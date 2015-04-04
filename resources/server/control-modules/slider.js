
var slider = function(config, prtktd){

    prtktd = prtktd || {};

    // this object inherits from the abstract object
    var module = require('./_abstract-module.js');
    var pblc = module(config, prtktd);

    return pblc;
};

module.exports = slider;

// nice logging
require('colors');