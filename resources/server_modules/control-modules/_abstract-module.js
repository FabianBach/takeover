
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
        ioNamespace,
        activeConnections = {},
        waitingConnections = [],
        eventHandler;

    // this function will be called at first
    // it will validate the configuration and set the super object to inherit from
    var init = function(){

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

    var initialization = init();
    // if something goes wrong do not return an instance but an object containing information about the error
    if (initialization.error) return {error: initialization.error};

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

    }


    // this will create a new namespace for sockets to connect directly to this server module
    // it will also handle the connecting sockets and save the references
    // also, the connections will be set active or put in the waiting line
    function createSocket (io){
        // creates a new and unique namespace using the id
        ioNamespace = io.of("/" + getId());

        // will ce invoked when a client connects to the namespace
        ioNamespace.on('connection', function(socket){
            activeConnections.length = activeConnections.length || 0;
            console.log('Connected to module ' + getNameAndId());

            // if the max number of users is not reached yet set socket active
            // else put socket in waiting line
            if (activeConnections.length < maxUsers){
                enableSocket(socket);
            }else{
                disableSocket(socket);
            }

            // after a timeout the connection will be disabled and put back in waiting line
            if(maxTime){
                setTimeout(function(){
                    disableSocket(socket);
                }, maxTime);
            }

            console.log('maxUsers: \t' + maxUsers.toString().yellow, '\nactive: \t' + activeConnections.length.toString().yellow, '\nwaiting: \t' + waitingConnections.length.toString().yellow);

        });
    }

    function enableSocket(socket){
        activeConnections[socket.id] = socket;
        activeConnections.length = activeConnections.length + 1;
        eventHandler.fire('active_socket_connected', socket);

        socket.on('disconnect', function(){
            delete activeConnections[socket.id];
            activeConnections.length = activeConnections.length - 1;
            eventHandler.fire('active_socket_disconnected', socket);
        });
        socket.on('value_change', function(){
            eventHandler.fire('value_change', arguments);
        });

        socket.emit('enable');

        return socket;
    }

    // will move the socket back to the waiting list and disable its interface on the client
    function disableSocket(socket){

        // removes the listener
        // function has to be provided
        socket.removeListener('value_change', function(){
            eventHandler.fire('value_change', arguments);
        });

        // remove from active list if it was disabled from timeout
        if (activeConnections[socket.id]){
            delete activeConnections[socket.id];
            activeConnections.length = activeConnections.length - 1;
            eventHandler.fire('active_socket_disabled', socket);
        }
        // push it back in waiting line
        waitingConnections.push(socket);
        eventHandler.fire('waiting_socket_connected', socket);
        socket.emit('disable');
    }

    // this will step trough the waiting list until it finds a connected socket
    // this socket will then be made active
    function onActiveSocketDisconnect(){
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

    // sets all the listeners on the shared event handler and appends functions to the events
    function setEvents(){
        eventHandler.on('value_change', onValueChange);
        eventHandler.on('active_socket_disconnected', onActiveSocketDisconnect);
        eventHandler.on('active_socket_disabled', onActiveSocketDisconnect); // invoke same function
    }

    // gets invoked when a client sends a new value for the module
    // should check if value is a valid one and then call mapping
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
        if (newName){ name = String(newName)}
    }

    function getNameAndId (){
        return getName().yellow + '(' + getId().grey + ')';
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
        shared.getTitle = getTitle;
        shared.getEventHandler = getEventHandler;
        shared.getMaxUserNumber = getMaxUserNumber;
        shared.getMaxTime = getMaxTime;
        shared.getActiveConnectionsCount = getActiveConnectionsCount;
        shared.getWaitingConnectionsCount = getWaitingConnectionsCount;

        // funcs
        shared.init = init; // TODO: check if in use or delete
        shared.doMapping = doMapping; // TODO: check if in use or delete
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
    that.getMaxUserNumber = getMaxUserNumber;
    that.getMaxTime = getMaxTime;
    that.getActiveConnectionsCount = getActiveConnectionsCount;
    that.getWaitingConnectionsCount = getWaitingConnectionsCount;

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

    // title
    if (!config.title){ config.title = ''}

    // multiple users
    if (!config.maxUsers){ config.maxUsers = 1}

    // max use time
    if (!config.maxTime){ config.maxTime = 0}

    return {error: error};
}


// nice logging
require('colors');