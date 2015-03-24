
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
    // public stuff will be added to the returned object
    var id,
        name,
        type,
        title,
        mappings,
        maxUsers,
        maxTime,
        inUse,
        inUseSocket,
        resolution,
        value,
        minValue,
        maxValue,
        ioSocket,
        ioNamespace,
        activeConnections = {},
        waitingConnections = [];

    var eventHandler,
        validator,
        mapper;


    // this function will be called at first
    // it will validate the configuration and set the super object to inherit from
    var init = function(){

        //eventHandler = require('./../event-part.js')(); // could be replaced by node event handler
        eventHandler = new (require('events').EventEmitter);
        validator = require(global.tkvrBasePath + '/resources/server/validation-module');
        mapper = require(global.tkvrBasePath + '/resources/server/mapping-module');

        var validationLog = validator.validateConfig(config);
        if (validationLog.error.length) return {error: validationLog.error};

        applyConfig(config);

        var socketLog = createSocket(config.io);
        if (socketLog.error.length) return {error: socketLog.error};

        setEvents();

        // TODO: apply special mapping or value when no client is connected initially
        // also, the startup mapping will be applied, so this has to be done afterwards

        setPublicMembers();
        setProtectedMembers();

        return {error: []};
    };

    // use the information provided in the validated configuration to set and override variables of the object
    function applyConfig (config){

        id = config.id;
        name = config.name;
        type = config.type;
        title = config.title;

        // multiple users
        maxUsers = config.maxUsers;
        maxTime = config.maxTime;

        inUse = false;
        activeConnections.sockets = {};

        resolution = config.resolution;

        maxValue = resolution;
        minValue = 0;
        value = minValue;

        mappings = config.mapping;
    }

    function setForeignValueListeners(){
        //step through mappings and set listeners

        for(var i=0; i<mappings.length; i++){
            var mapping = mappings[i];
            //FIXME: feels wrong to having a switch case logic here somehow...
            switch(mapping.type){
                case 'dmx':
                    setListener(mapping);
                    break;
                case 'midi':
                    setListener(mapping.byte_1);
                    setListener(mapping.byte_2);
                    break;
                case 'osc':
                    //TODO: osc foreign value lsitener
                    break;
            }

            function setListener(mapping){
                if(mapping.foreignValue){
                    //FIXME: use .bind
                    shared.setForeignListener(mapping.foreignValue, function(value){
                        eventHandler.emit('foreign_value_change', value);
                    });
                }
            }
        }
    }

    // this will create a new namespace for sockets to connect directly to this server module
    // it will also handle the connecting sockets and save the references
    // also, the connections will be set active or put in the waiting line
    function createSocket (io){
        var error = [];
        // creates a new and unique namespace using the id
        ioSocket = io;
        ioNamespace = io.of("/" + getId());

        // will be invoked when a client connects to the namespace
        ioNamespace.on('connection', function(socket){
            activeConnections.length = activeConnections.length || 0;
            console.log('Connected to module ' + getNameAndId() + socket.id.grey);

            socket.on('disconnect', function(){
                disableSocket(socket);
                socket.disconnect();
            });

            // if the max number of users is not reached yet set socket active
            // else put socket in waiting line
            if (!inUse || activeConnections.length < maxUsers){
                enableSocket(socket);
            }else{
                putSocketBackInLine(socket);
            }

            socket.emit('value_update', getValue());

            console.log('maxUsers: ' + maxUsers.toString().cyan, '\tactive: ' + activeConnections.length.toString().cyan, '\twaiting: ' + waitingConnections.length.toString().cyan);

        });

        return {error: error};
    }

    function setSocketTimeout(socket){
        // after a timeout the connection will be disabled and put back in waiting line
        if (maxTime === Infinity){ return }
        socket.disableTimeout = setTimeout(function(){
            waitingConnections.length
                ? onSocketDisableTimeout(socket)
                : setSocketTimeout(socket)
        }, maxTime);
    }

    function clearSocketTimeout(socket){
        if (maxTime === Infinity){ return }
        clearTimeout(socket.disableTimeout);
    }

    function onSocketDisableTimeout(socket){
        //reactivate waiting crowd
        moveWatingline();

        socket.on('use_end', disable);

        function disable(){
            socket.removeListener('use_end', disable);
            putSocketBackInLine(socket);
        }
    }

    function enableSocket(socket){
        activeConnections.sockets[socket.id] = socket;
        activeConnections.length = activeConnections.length + 1;
        eventHandler.emit('socket_enabled', socket);
        // TODO: apply special mapping or value when connected before first input

        socket.on('value_change', fireValueChange.bind(null, socket));
        socket.on('in_use', fireInUse.bind(null, socket));
        socket.on('use_end', fireUseEnd.bind(null, socket));

        socket.emit('enable', getValue());
        setSocketTimeout(socket);

        return socket;
    }

    function putSocketFrontInLine(socket){

        disableSocket(socket);
        // push it back in waiting line if still connected
        if(socket.connected){
            waitingConnections.unshift(socket);
        }
    }

    function putSocketBackInLine(socket){

        disableSocket(socket);
        // push it back in waiting line if still connected
        if(socket.connected){
            waitingConnections.push(socket);
        }

        moveWatingline();
    }

    // will move the socket back to the waiting list and disable its interface on the client
    function disableSocket(socket){

        socket.removeAllListeners('value_change');
        socket.removeAllListeners('in_use');
        socket.removeAllListeners('use_end');
        clearSocketTimeout(socket);
        socket.emit('disable');

        eventHandler.emit('socket_disabled', socket);

        // remove from active list if it was active
        if(activeConnections.sockets[socket.id]){
            delete activeConnections.sockets[socket.id];
            activeConnections.length = activeConnections.length - 1;

            if(inUseSocket && (socket.id === inUseSocket.id)){
                eventHandler.emit('socket_in_use_disabled', socket);
                console.log('socket_in_use_disabled'.red);
            }
        }
    }

    // this will step trough the waiting list until it finds a connected socket
    // this socket will then be made active
    function moveWatingline(){

        for(var a = activeConnections.length;
            a < maxUsers && waitingConnections.length > 0;
            a++){

            var socket = waitingConnections.shift();
            if (socket.connected){
                enableSocket(socket);
            }
        }

        if (!activeConnections.length) {
            console.log('No connections to ' + getNameAndId());
            eventHandler.emit('no_connections');
        }
    }

    function fireValueChange(socket, data){
        eventHandler.emit('value_change', data, socket);
    }
    function fireInUse(socket){
        eventHandler.emit('in_use', socket);
    }
    function fireUseEnd(socket){
        eventHandler.emit('use_end', socket);
    }

    function setEvents(){
        eventHandler.on('value_change', onValueChange);
        eventHandler.on('foreign_value_change', onForeignValueChange);
        eventHandler.on('in_use', onUse);
        eventHandler.on('use_end', onUseEnd);
        eventHandler.on('no_connections', onNoConnections);
    }

    //FIXME: use .bind
    function bindForeignValueListener(listener){
        eventHandler.on('value_change', listener);
    }

    // gets invoked when a client sends a new value for the module
    // should check if value is a valid one and then call mapping
    function onValueChange (value, socket){
        var dataLog = checkData(value);
        if (dataLog.error.length) return console.log('Module ' + shared.getNameAndId() + ' received bad value: ', value, dataLog);

        setValue(value);

        var processLog = processValue(value);
        if (processLog.error.length) return console.log('Module ' + shared.getNameAndId() + ' could not map value ', value, processLog);

        socket.broadcast.emit('value_update', value);
    }

    function onForeignValueChange (value){
        if(!getInUse().status){ return; }
        // will do mapping with the actual value to update foreign value mappings
        var processLog = processValue(getValue());
        if (processLog.error.length) return console.log('Module ' + shared.getNameAndId() + ' could not map value ', value, processLog);
    }

    function processValue (value){
        console.log('Module ' + getNameAndId() + ' value: ', value);
        var mapLog = mapper.doMapping(value, getMaxValue(), mappings);
        return mapLog;
    }

    // this function is supposed to check if the data is okay or if something messed up
    // it could also correct the data in the object if an minor error is found and log a warning
    function checkData (data){
        // TODO: check recieved data
        // probably best to use same validation as on init
        return {error: []}
    }

    function onUse(socket){
        socket.broadcast.emit('foreignUse', true);
        inUse = true;
        inUseSocket = socket;
        var disableArray = [];

        for(var someSocketId in activeConnections.sockets){
            var someSocket = activeConnections.sockets[someSocketId];
            if (someSocket.id !== socket.id){
                // we have to disable them after filtering them
                // because we would manipulate the object while stepping through it
                disableArray.push(someSocket);
            }
        }
        // now step through cache and disable
        for(var i=0; i < disableArray.length; i++){
            var disableSocket = disableArray[i];
            putSocketFrontInLine(disableSocket);
        }
    }

    function onUseEnd(socket){
        socket.broadcast.emit('foreignUse', false);
        moveWatingline();
        inUse = false;
        inUseSocket = null;
    }

    function onNoConnections(){
        // TODO: apply special mapping on no client connected
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

    //FIXME: this should not need a flag
    function setValue(data, fireEvent, socket){
        value = data;
        if (fireEvent){
            fireValueChange(socket, data)
        }
    }

    function getMinValue(){
        return minValue;
    }

    function getMaxValue(){
        return maxValue;
    }

    function getNamespace(){
        return ioNamespace.name;
    }

    function getInUse(){
        return {
            status: inUse,
            socket: inUseSocket
        }
    }

    /*
     * ** PUBLIC STUFF **
     */
    // now add the functions to the returned object, which are supposed to be public in the interface
    // that.methodName = funcName;

    function setPublicMembers(){
        that.getId = getId;
        that.getName = getName;
        that.getNamespace = getNamespace;
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
        //that.onValueChange = eventHandler.on.bind(null, 'value_change');
        that.onValueChange = bindForeignValueListener;
        that.setForeignValueListeners = setForeignValueListeners;
    }

    function setProtectedMembers(){
        // inherit from public
        for(var publicMember in that){
            shared[publicMember] = that[publicMember];
        }

        // vars
        shared.setValue = setValue;
        shared.setName = setName;
        shared.getNameAndId = getNameAndId;
        shared.getEventHandler = getEventHandler;
        shared.getInUse = getInUse;
    }

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
 *
 * the following stuff will not be altered at runtime
 * and will be the same for every instance of the module
 * somehow like writing it to the prototype object, but not public
 * this can not be invoked by an inheriting object, except by reference
 */


// nice logging
require('colors');