
// this function will return a new object with its own private scope and public methods
// it can be handed a configuration object
// somehow like a factory
var abstractModule = function(config, shared){

    /*
     * ** PRIVATE STUFF **
     */

    // this object will be provided by an object that inherits from this object
    // we can add members to it we want to share with it, but we don't want to make public
    // the inheriting object can then use the normally private methods of this object
    shared = shared || {};

    // this class does not inherit from any other class
    // so we start with a new and empty object
    // this object will be returned at the end
    var that = {};

    // everything is private and can not be invoked outside of this scope
    // function will be appended to the returned object
    var id,
        name,
        type,
        position,
        size,
        ioNamespace,
        sockets = [],
        eventHandler;

    // this function will be called at first
    // it will validate the configuration and set the super object to inherit from
    var init = function(){

        id = parseInt(Math.random() * new Date().getTime() * 10000000).toString(36).toUpperCase();

        eventHandler = require('./../event-part.js')();

        var validationLog = validateConfig(config);
        if (validationLog.error.length) return {error: validationLog.error};

        var applyLog = applyConfig(config);
        //if (applyLog.error.length) return {error: applyLog.error};

        var socketLog = createSocket(config.io);
        //if (socketLog.error.length) return {error: socketLog.error};

        var eventLog = setEvents();
        //if (socketLog.error.length) return {error: socketLog.error};

        setShared();

        return {};
    };

    //if something goes wrong do not return an instance but an object containing information about the error
    var initialization = init();
    if (initialization.error) return {error: initialization.error};


    // use the information provided in the validated configuration to set and override variables of the object
    function applyConfig (config){

        // name
        name = config.name;

        // type
        type = config.type;

        // position - validation required
        position = config.position;

        // size - validation required
        size = config.size;

    }

    function createSocket (io){
        ioNamespace = io.of("/" + getId());

        ioNamespace.on('connection', function(socket){
            sockets.push(socket);
            console.log('Connected to module ' + getNameAndId());
            eventHandler.fire('socket_connected', socket);

            socket.on('value_change', function(){
                eventHandler.fire('value_change', arguments);
            });
        })
    }

    function setEvents(){
        eventHandler.on('value_change', onValueChange)
    }

    function onValueChange (data){
        console.log('Module ' + getNameAndId(), data);

        // validate the received data
        var dataLog = checkData(data);
        if (dataLog.error.length) return console.log('Invalid data');

        // send out that OSC, MIDI or whatever protocol
        doMapping(data);
    }

    // this function is supposed to check if the data is okay or if something messed up
    // it could also correct the data in the object if an minor error is found and log a warning
    function checkData (data){
        return {error: {}}
    }

    // this function is supposed to map the received value to the different protocol values
    // according to the mapping object defined in the config
    // this method has to be defined by each specific module itself
    // there is no general way to do this in this abstract object
    function doMapping (data){

        console.log('Module ' + getNameAndId() + ' would do mapping now: ', data);
    }

    // getters and setters

    function getId (){
        return id;
    }

    function getName (){
        return name === 'unnamed' ? getId() : name;
    }

    function setName (newName){
        if(newName){ name = String(newName)}
    }

    function getNameAndId (){
        return getName().yellow + '(' + getId().grey + ')';
    }

    function getType (){
        return type;
    }

    function getEventHandler (){
        return eventHandler;
    }

    /*
     * ** SHARED STUFF **
     */

    // gets called at the end of the init() function
    function setShared() {
        // vars
        shared.getId = getId;
        shared.getName = getName;
        shared.setName = setName;
        shared.getNameAndId = getNameAndId;
        shared.getType = getType;
        shared.getEventHandler = getEventHandler;

        // funcs
        shared.init = init;
        shared.doMapping = doMapping;
    }

    /*
     * ** PUBLIC STUFF **
     */
    // now add the functions to the returned object, which are supposed to be public in the interface
    // that.methodName = funcName;

    that.getId = getId;
    that.getName = getName;
    that.getType = getType;


    // return the finished object (somewhat an instance of the module object)
    return that;
};

// return the specified object when using require()
module.exports = abstractModule;

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

    error = [];

    //config itself
    if (!config){
        error.push('No config found!');
        config = {};
    }

    // socket instance
    if (!config.io){ error.push('No io in config')}
    else {
        //if (config.io._path !== './socket.io'){ error.push('io in config is no socket.io')} // config.io._path is undefined!!
    }

    //name
    if (!config.name){ config.name = 'unnamed' }
    else {config.name = String(config.name)}

    // type
    if (!config.type){ error.push('No type in config') }

    // position
    if (!config.position){ error.push('No position in config')}
    else {
        if (config.position.x === undefined){ error.push('No x-position in config')}
        if (config.position.y === undefined){ error.push('No y-position in config')}
    }

    // size
    if (!config.size){ error.push('No size in config')}
    else {
        if (!config.size.x){ error.push('No x-size in config')}
        if (!config.size.y){ error.push('No y-size in config')}
    }

    return {error: error};
}


// nice logging
require('colors');