
var slider = function(config, shared){

    shared = shared || {};

    // this object inherits from the abstract object
    var that = require('./_abstract-module.js');
    that = that(config, shared);

    //var eventHandler;
    //
    //var init = function(){
    //
    //  var validationLog = validateConfig(config);
    //  if (validationLog.error.length) return {error: validationLog.error};
    //
    //
    //    eventHandler = (shared.getEventHandler && shared.getEventHandler()) || require('./../event-part.js');
    //    setEvents();
    //
    //    return {};
    //};
    //
    //function setEvents(){
    //    eventHandler.on('value_change', onValueChange);
    //}
    //
    //function onValueChange(data){
    //    check specific data before handing it to the super object
    //    return false; // stop the super-object from getting this event // bad idea
    //}
    //
    //var initialization = init();
    //if (initialization.error) return {error: initialization.error};

    return that;
};

module.exports = slider;

/*
 * ** STATIC STUFF **
 */

//function validateConfig(config) {
//
//    var error = [];

// validate

//return {error: error};
//}

// nice logging
require('colors');