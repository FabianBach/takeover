
var button = function(config, shared){

    shared = shared || {};

    // this object inherits from the abstract object
    var that = require('./_abstract-module.js');
    that = that(config, shared);

    var eventHandler = shared.getEventHandler();
    eventHandler.on('socket_disabled', onSocketDisable);

    function onSocketDisable(socket){

        var inUse = shared.getInUse();
        if (inUse.status !== true){ return }

        if (inUse.socket.id === socket.id){
            var minValue = shared.getMinValue();
            shared.setValue(minValue);
        }
    }

    return that;
};

module.exports = button;

// nice logging
require('colors');