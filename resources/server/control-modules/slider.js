
var slider = function(config, prtktd){

    prtktd = prtktd || {};

    var module = require('./_abstract-module.js'); // new module
    var pblc = module(config, prtktd);

    return pblc;
};

module.exports = slider;

// nice logging
require('colors');