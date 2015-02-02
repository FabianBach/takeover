
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
        title,
        maxUsers,
        maxTime,
        resolution,
        value,
        minValue,
        maxValue,
        ioNamespace,
        activeConnections = {},
        waitingConnections = [],
        eventHandler;

    // this function will be called at first
    // it will validate the configuration and set the super object to inherit from
    var init = function(){

        eventHandler = require('./../event-part.js')(); // could be replaced by node event handler

        var validationLog = validateConfig(config);
        if (validationLog.error.length) return {error: validationLog.error};

        applyConfig(config);

        var socketLog = createSocket(config.io);
        if (socketLog.error.length) return {error: socketLog.error};

        setEvents();
        setShared();

        return {error: []};
    };

    // use the information provided in the validated configuration to set and override variables of the object
    function applyConfig (config){

        // id
        id = config._id;

        // name
        name = config.name;

        // type
        type = config.type;

        // title
        title = config.title;

        // multiple users
        maxUsers = config.maxUsers;

        // max time to use this before it lets next person
        maxTime = config.maxTime;

        resolution = config.resolution;

        maxValue = resolution;
        minValue = 0;
        value = minValue;

    }


    // this will create a new namespace for sockets to connect directly to this server module
    // it will also handle the connecting sockets and save the references
    // also, the connections will be set active or put in the waiting line
    function createSocket (io){
        var error = [];
        // creates a new and unique namespace using the id
        ioNamespace = io.of("/" + getId());

        // will be invoked when a client connects to the namespace
        ioNamespace.on('connection', function(socket){
            activeConnections.length = activeConnections.length || 0;
            console.log('Connected to module ' + getNameAndId() + socket.id.grey);

            socket.on('disconnect', function(){
                disableSocket(socket);
            });

            // if the max number of users is not reached yet set socket active
            // else put socket in waiting line
            if (activeConnections.length < maxUsers){
                enableSocket(socket);
            }else{
                disableSocket(socket);
            }

            console.log('maxUsers: ' + maxUsers.toString().cyan, '\tactive: ' + activeConnections.length.toString().cyan, '\twaiting: ' + waitingConnections.length.toString().cyan);

        });

        return {error: error};
    }

    function setSocketTimeout(socket){
        // after a timeout the connection will be disabled and put back in waiting line
        if(maxTime){
            setTimeout(function(){
                waitingConnections.length
                    ? disableSocket(socket)
                    : setSocketTimeout(socket)
            }, maxTime);
        }
    }

    function enableSocket(socket){
        activeConnections[socket.id] = socket;
        activeConnections.length = activeConnections.length + 1;
        eventHandler.fire('socket_enabled', socket);

        socket.on('value_change', fireValueChange);

        socket.emit('enable');
        setSocketTimeout(socket);

        return socket;
    }

    // will move the socket back to the waiting list and disable its interface on the client
    function disableSocket(socket){

        // removes the listener
        // function has to be provided to find listener
        socket.removeListener('value_change', fireValueChange);

        // push it back in waiting line
        if(socket.connected){
            waitingConnections.push(socket);
            eventHandler.fire('socket_waiting', socket);
            socket.emit('disable');
        }

        // remove from active list
        if(activeConnections[socket.id]){
            delete activeConnections[socket.id];
            activeConnections.length = activeConnections.length - 1;
            eventHandler.fire('socket_disabled', socket);
        }
    }

    // this will step trough the waiting list until it finds a connected socket
    // this socket will then be made active
    function moveWatingline(){
        var newActive;
        for(var i = 0, l = waitingConnections.length, con; i < l; i++){
            con = waitingConnections.shift();
            if (con.connected){
                newActive = con;
                break;
            }
        }
        if (newActive){ enableSocket(newActive); }
    }

    // this is put in a seperate function to be able to remove it from the socket listener
    // TODO: could be merged with onValueChange?
    function fireValueChange(data){
        console.log(data);
        eventHandler.fire('value_change', data);
    }

    // sets all the listeners on the shared event handler and appends functions to the events
    function setEvents(){
        eventHandler.on('value_change', onValueChange);
        eventHandler.on('socket_disabled', moveWatingline);
    }

    // gets invoked when a client sends a new value for the module
    // should check if value is a valid one and then call mapping
    function onValueChange (data){
        setValue(data);
    }

    // getters and setters

    function getId (){
        return id;
    }

    function getName (){
        return name === 'unnamed' ? getId() : name;
    }

    function setName (newName){
        if (newName){ name = String(newName)}
    }

    function getNameAndId (){
        return getName().cyan + ' (' + getId().grey + ')';
    }

    function getType (){
        return type;
    }

    function getTitle (){
        return title;
    }

    function getEventHandler (){
        return eventHandler;
    }

    function getMaxUserNumber (){
        return maxUsers;
    }

    function getMaxTime (){
        return maxTime;
    }

    function getActiveConnectionsCount(){
        return activeConnections.length
    }

    function getWaitingConnectionsCount(){
        return waitingConnections.length
    }

    function getResolution(){
        return resolution;
    }

    function getValue(){
        return value;
    }

    function setValue(data){
        value = data;
    }

    function getMinValue(){
        return minValue;
    }

    function getMaxValue(){
        return maxValue;
    }

    /*
     * ** SHARED STUFF **
     */
    // gets called at the end of the init() function
    function setShared() {

        // inherit from public
        for(var publicMember in that){
            shared[publicMember] = that[publicMember];
        }

        // vars
        shared.setValue = setValue;
        shared.setName = setName;
        shared.getNameAndId = getNameAndId;
        shared.getEventHandler = getEventHandler;

        // funcs
        //shared.init = init; // TODO: check if in use or delete
        //shared.doMapping = doMapping; // TODO: check if in use or delete
    }

    /*
     * ** PUBLIC STUFF **
     */
    // now add the functions to the returned object, which are supposed to be public in the interface
    // that.methodName = funcName;

    that.getId = getId;
    that.getName = getName;
    that.getType = getType;
    that.getTitle = getTitle;
    that.getResolution = getResolution;
    that.getValue = getValue;
    that.getMinValue = getMinValue;
    that.getMaxValue = getMaxValue;
    that.getMaxUserNumber = getMaxUserNumber;
    that.getMaxTime = getMaxTime;
    that.getActiveConnectionsCount = getActiveConnectionsCount;
    that.getWaitingConnectionsCount = getWaitingConnectionsCount;


    var initialization = init();
    // if something goes wrong do not return an instance but an object containing information about the error
    if (initialization.error.length) return {error: initialization.error};
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

    var error = [];

    // config itself
    if (!config){
        error.push('No config found!');
        config = {};
    }

    // socket instance
    if (!config.io){ error.push('No io in config')}

    // id, create if missing
    if (!config._id){ config._id = parseInt(Math.random() * new Date().getTime() * 10000000).toString(36).toUpperCase(); }

    // name
    if (!config.name){ config.name = 'unnamed' }
    else {config.name = String(config.name)}

    // type
    if (!config.type){ error.push('No type in config') }
    config.type = config.type.toLowerCase();

    // title
    if (!config.title){ config.title = ''}

    // multiple users
    config.maxUsers = parseInt(config.maxUsers) || 1;

    // max use time
    config.maxTime = parseInt(config.maxTime) * 1000 || 0;

    // resolution
    config.resolution = parseInt(config.resolution || 100);

    return {error: error};
}


// nice logging
require('colors');