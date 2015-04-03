
var button = function(config, prtktd){

    prtktd = prtktd || {};

    var module = require('./_abstract-module.js');
    var pblc = module(config, prtktd);

    var eventHandler = prtktd.getEventHandler();
    eventHandler.on('socket_in_use_disabled', onSocketInUseDisable);

    //TODO: test this
    function onSocketInUseDisable(socket){
        var minValue = prtktd.getMinValue();
        prtktd.setValue(minValue, true, socket);
    }

    return pblc;
};

module.exports = button;

// nice logging
require('colors');