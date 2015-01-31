
// this function will return a new object with its own private scope and public methods
// it can be handed a configuration object
// somehow like a factory
var simpleButton = function(config, shared){

    /*
     * ** PRIVATE STUFF **
     */

    // this object will be provided by an object that inherits from this object
    // we can add members to it we want to share with it, but we don't want to make public
    // the inheriting object can then use the normally private methods of this object
    shared = shared || {};

    // this object inherits from the abstract object
    // we start with a new and empty shared object
    var that = require('./_abstract-module.js');
        that = that(config, shared);

    // everything is private and can not be invoked outside of this scope
    // function will be appended to the returned object
    var eventHandler;

    // this function will be called at first
    var init = function(){

        eventHandler = (shared.getEventHandler && shared.getEventHandler()) || require('./../event-part.js');

        var validationLog = validateConfig(config);
        if (validationLog.error.length) return {error: validationLog.error};

        var applyLog = applyConfig(config);
        //if (applyLog.error.length) return {error: applyLog.error};

        var eventLog = setEvents();
        //if (socketLog.error.length) return {error: socketLog.error};

        setShared();

        return {};
    };

    var initialization = init();
    //if something goes wrong do not return an instance but an object containing information about the error
    if (initialization.error) return {error: initialization.error};

    // use the information provided in the validated configuration to set and override variables of the object
    function applyConfig (config){

    }

    function setEvents(){
        eventHandler.on('value_change', onValueChange);
    }

    function onValueChange(data){
        var dataLog = checkData(data);
        if(dataLog.error.length) return console.log('Module ' + shared.getNameAndId() + ' received bad data: ', data, dataLog);

        var mappingLog = doMapping(data);
        if(mappingLog.error.length) return console.log('Module ' + shared.getNameAndId() + ' could not map data ', data, mappingLog);

        return false; // stop the super-object from getting this event
    }

    // this function is supposed to check if the data is okay or if something messed up
    // it could also correct the data in the object if an minor error is found and log a warning
    function checkData (data){
        return {error: []}
    }

    // this function is supposed to map the received value to the different protocol values
    // according to the mapping object defined in the config
    // this method has to be defined by each specific module itself
    // there is no general way to do this in this abstract object
    function doMapping (data){
        console.log('Module ' + shared.getNameAndId() + ' value: ', data);

        return {error: []}
    }

    // getters and setters
    // TODO

    /*
     * ** SHARED STUFF **
     */

    function setShared(){
        // vars

        // funcs
        shared.init = init;
        shared.doMapping = doMapping;
    }

    /*
     * ** PUBLIC STUFF **
     */
    // now add the functions to the returned object, which are supposed to be public in the interface
    // that.methodName = funcName;
    // TODO

    // return the finished object (somewhat an instance of the module object)
    return that;
};

// return the specified object when using require()
module.exports = simpleButton;

/*
 * ** STATIC STUFF **
 * the following stuff will not be altered at runtime
 * and will be the same for every instance of the module
 * somehow like writing it to the prototype object, but not public
 * this can not be invoked by an inheriting object, except by reference
 */

// this function will check for errors in the config object
// this will only check values which all modules have in common
// every module will have to check for its specific config values
function validateConfig(config){

    var error = [];

    return {error: error};
}

// nice logging
require('colors');