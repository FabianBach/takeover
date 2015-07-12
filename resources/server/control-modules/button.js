
var button = function(config, prtktd){

    prtktd = prtktd || {};

    var module = require('./_abstract-module.js'); // new module
    var pblc = module(config, prtktd);

    var sharedEventHandler = prtktd.getEventHandler();
    sharedEventHandler.on('socket_in_use_disabled', onSocketInUseDisable);

    function onSocketInUseDisable(socket){
        var minValue = prtktd.getMinValue();
        prtktd.setValue(minValue, true, socket);
    }

    return pblc;
};

module.exports = button;

// nice logging
require('colors');