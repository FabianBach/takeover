
// this function will return a new object with its own private scope and public methods
// it can be handed a configuration object
// somehow like a factory
var abstractModule = function(config, prtktd){

    /*
     * ** PRIVATE STUFF **
     */

    // this object will be provided by an object that inherits from this object
    // we can add members to it we want to share with it, but we don't want to make public
    // the inheriting object can then use the normally private methods of this object
    prtktd = prtktd || {};

    // this class does not inherit from any other class
    // so we start with a new and empty object
    // this object will be returned at the end
    var pblc;

    // everything is private and can not be invoked outside of this scope
    // public stuff will be added to the returned object
    var isParent,
        isChild;

    var parentObj,
        childObjs;

    var id,
        name,
        type,
        title,
        mappings,
        animations,
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

    var privateEventHandler, // for modules internally
        sharedEventHandler, // for connnected parent and child modules
        globalEventHandler, // for all modules created ever
        validator,
        mapper,
        animator;

    // this function will be called at first
    // it will validate the configuration and set the super object to inherit from
    var init = function(){

        validator = require(global.tkvrBasePath + '/resources/server/validation-module');
        mapper = require(global.tkvrBasePath + '/resources/server/mapping-module');
        animator = require(global.tkvrBasePath + '/resources/server/animation-module');

        var validationLog = validator.validateConfig(config);
        if (validationLog.error.length) return {error: validationLog.error};

        applyConfig(config);

        if (!isChild){
            var socketLog = createSocket(config.io);
            if (socketLog.error.length) return {error: socketLog.error};
        }

        setEvents();

        // TODO: apply special mapping or value when no client is connected initially
        // also, the startup mapping will be applied, so this has to be done afterwards

        setPublicMembers();
        setProtectedMembers();

        return {error: []};
    };

    // use the information provided in the validated configuration to set and override variables of the object
    function applyConfig (config){

        isParent = !!config.isParent;
        isChild = !!config.isChild;
        if (isChild){
            parentObj = config.parentObj;
        }

        privateEventHandler = new (require('events').EventEmitter);
        sharedEventHandler = (prtktd.getEventHandler && prtktd.getEventHandler()) || new (require('events').EventEmitter);
        globalEventHandler = config.globalEventHandler;
        inUse = false;

        id = config.id;
        name = config.name;
        type = config.type;
        title = config.title;

        // multiple users - if isParent && !isChild only but does not matter
        maxUsers = config.maxUsers;
        maxTime = config.maxTime;
        activeConnections.sockets = {};

        resolution = config.resolution;
        maxValue = resolution;
        minValue = 0;
        value = minValue;

        mappings = config.mapping;
        animations = config.animation;
    }

    function setForeignValueListeners(){
        if(isParent){
            return;
        }

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
                    //TODO: osc
                    break;
            }

            function setListener(mapping){
                if(mapping.foreignValue){
                    prtktd.setForeignListener(mapping.foreignValue, function(value){
                        privateEventHandler.emit('foreign_value_change', value);
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

        if(isChild){
            return {error: error};
        }

        // creates a new and unique namespace using the id
        ioSocket = io;
        ioNamespace = io.of(getNamespace());

        // will be invoked when a client connects to the namespace
        ioNamespace.on('connection', function(socket){
            activeConnections.length = activeConnections.length || 0;
            console.log('Connected to module ' + getNameAndId() + socket.id.grey);

            socket.on('disconnect', function(){
                disableSocket(socket);
                //socket.disconnect();
            });

            // if the max number of users is not reached yet set socket active
            // else put socket in waiting line
            if (!inUse && activeConnections.length < maxUsers){
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
            waitingConnections.length > 0
                ? onSocketDisableTimeout(socket)
                : setSocketTimeout(socket)
        }, maxTime);
    }

    function clearSocketTimeout(socket){
        if (maxTime === Infinity){ return }
        clearTimeout(socket.disableTimeout);
    }

    function onSocketDisableTimeout(socket){
        // enable waiting crowd
        moveWaitingline();

        if(getInUse().socket === socket){
            socket.on('use_end', disable);
        } else {
            disable()
        }

        function disable(){
            socket.removeListener('use_end', disable);
            putSocketBackInLine(socket);
            //sharedEventHandler.emit('use_end', socket);
            //onUseEnd(socket);
        }
    }

    function enableSocket(socket){
        activeConnections.sockets[socket.id] = socket;
        activeConnections.length = activeConnections.length + 1;
        privateEventHandler.emit('socket_enabled', socket);
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

        moveWaitingline();
    }

    // will disable its interface on the client
    function disableSocket(socket){
        socket.removeAllListeners('value_change');
        socket.removeAllListeners('in_use');
        socket.removeAllListeners('use_end');
        clearSocketTimeout(socket);
        socket.emit('disable');

        privateEventHandler.emit('socket_disabled', socket);

        // remove from active list if it was active
        if(activeConnections.sockets[socket.id]){
            delete activeConnections.sockets[socket.id];
            activeConnections.length = activeConnections.length - 1;

            if(inUseSocket && (socket.id === inUseSocket.id)){
                fireUseEnd(socket);
                sharedEventHandler.emit('socket_in_use_disabled', socket);
                console.log('socket_in_use_disabled'.red);
            }
        }
    }

    // this will step trough the waiting list until it finds a connected socket
    // this socket will then be made active
    function moveWaitingline(){

        for(var a = activeConnections.length;
            a < (maxUsers + getInUse().status)
            && waitingConnections.length > 0;
            a++){

            var socket = waitingConnections.shift();
            if (socket.connected){
                enableSocket(socket);
            }
        }

        if (!activeConnections.length) {
            console.log('No connections to ' + getNameAndId());
            sharedEventHandler.emit('no_connections');
        }
    }

    function fireValueChange(socket, data){
        privateEventHandler.emit('value_change', data, socket);
    }

    function fireInUse(socket){
        sharedEventHandler.emit('in_use', socket);
    }

    function fireUseEnd(socket){
        sharedEventHandler.emit('use_end', socket);
    }

    function setEvents(){
        privateEventHandler.on('value_change', onValueChange);
        privateEventHandler.on('foreign_value_change', onForeignValueChange);

        sharedEventHandler.on('in_use', onUse);
        sharedEventHandler.on('use_end', onUseEnd);
        sharedEventHandler.on('no_connections', onNoConnections);

    }

    // this will notify foreign control modules about any value change
    // the foreign modules just leaves its callback
    function bindForeignValueListener(listener){
        //TODO: change to shared value-change?
        privateEventHandler.on('value_change', listener);
    }

    // gets invoked when a client sends a new value for the module
    // should check if value is a valid one and then call mapping
    function onValueChange (value, socket){

        setValue(value);

        if (isParent){
            for(var name in childObjs){
                var child = childObjs[name];
                var val = value[name];

                if(!child || val === undefined){
                    console.log('WARNING:'.yellow, 'no child or value with that name:', name);
                    break;
                }

                child.setValue(val, true, socket);
            }
        }

        if(!isChild){
            //TODO: get the value of the children after they checked it
            socket.broadcast.emit('value_update', value);
            //console.log('Module ' + getNameAndId() + ' value: ', value);
        }

        if (!isParent) {
            var dataLog = checkData(value);
            if (dataLog.error.length) return console.log('Module ' + prtktd.getNameAndId() + ' received bad value: ', value, dataLog);

            var processLog = processValue(value);
            if (processLog.error.length) return console.log('Module ' + prtktd.getNameAndId() + ' could not map value ', value, processLog);
        }
    }

    function onForeignValueChange (value){
        // only set and called if it is not a parent
        // will do mapping with the actual value to update foreign value mappings
        if(!getInUse().status){ return; }
        var processLog = processValue(getValue());
        if (processLog.error.length) return console.log('Module ' + prtktd.getNameAndId() + ' could not map value ', value, processLog);
    }

    function processValue (value){
        // only called if it is not a parent
        console.log('Module ' + getNameAndId() + ' value: ', value);

        var mapLog = mapper.doMapping(value, getMaxValue(), mappings);
        var animationLog = triggerAnimations(value);

        //TODO: animationLog is unused
        return mapLog;
    }

    // this function is supposed to check if the data is okay or if something messed up
    // it could also correct the data in the object if an minor error is found and log a warning
    function checkData (data){
        // TODO: check recieved data
        // probably best to use same validation as on init
        // parent can not do it, has to be done by children
        return {error: []}
    }

    function onUse(socket){
        inUse = true;

        if (!isChild){
            if (socket){
                socket.broadcast.emit('foreignUse', inUse);
                inUseSocket = socket;

            } else {
                ioNamespace.emit('foreignUse', inUse);
                inUseSocket = null;
            }

            var disableArray = [];
            for(var someSocketId in activeConnections.sockets){
                var someSocket = activeConnections.sockets[someSocketId];
                if (inUseSocket && (someSocket.id !== inUseSocket.id)){
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
    }

    function onUseEnd(socket){
        //TODO: if no uncancelable animation is running

        inUse = false;

        if (!isChild){
            if(socket){
                // self triggered event
                socket.broadcast.emit('foreignUse', inUse);

            } else {
                // foreign triggered event
                ioNamespace.emit('foreignUse', inUse);
            }

            inUseSocket = null;
            moveWaitingline();
        }
    }

    function onNoConnections(){
        // TODO: apply special mapping on no client connected
    }

    function triggerAnimations(){
        // TODO: triggerOnZero
        for (var animation in animations){

            var animationConfig = animations[animation];
            animator.triggerAnimation(animationConfig, onUpdateCallback, onCompleteCallback);
            // TODO: if animation is not cancelable set in use, disable all sockets
        }

        function onUpdateCallback(newValue, oldValue){
            //FIXME: looks tricky...
            animationConfig.value = newValue;
            console.log('animation is running', newValue, oldValue);
            //console.log(animationConfig);
            mapper.doMapping(0, 0, [animationConfig]);
        }

        function onCompleteCallback(){
            //on use end
        }
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
        return sharedEventHandler;
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
        return "/" + getId();
    }

    function getInUse(){
        return {
            status: inUse,
            socket: inUseSocket
        }
    }

    function setInUse(status, socket){
        inUse = !!status;
        inUseSocket = socket || null;
        return getInUse();
    }

    function addChild(name, config){

        //TODO: this is a little ugly like this
        var childPrtktd = {};
        childPrtktd.createModule = prtktd.createModule;
        childPrtktd.setForeignListener = prtktd.setForeignListener;
        childPrtktd.getEventHandler = prtktd.getEventHandler;

        var childPblc = prtktd.createModule(config, childPrtktd);

        setChild(name, childPrtktd);

        return childPrtktd;
    }

    function setChild(name, child){
        childObjs = childObjs || {};
        childObjs[name] = child;
        return child;
    }

    function getChild(name){
        var child = childObjs[name];
        return child || null;
    }

    /*
     * ** PUBLIC STUFF **
     */
    // now add the functions to the returned object, which are supposed to be public in the interface
    // pblc.methodName = funcName;

    function setPublicMembers(){
        pblc = {};
        pblc.getId = getId;
        pblc.getName = getName;
        pblc.getNamespace = getNamespace;
        pblc.getType = getType;
        pblc.getTitle = getTitle;
        pblc.getInUse = getInUse;
        pblc.getResolution = getResolution;
        pblc.getValue = getValue;
        pblc.getMinValue = getMinValue;
        pblc.getMaxValue = getMaxValue;
        pblc.getMaxUserNumber = getMaxUserNumber;
        pblc.getMaxTime = getMaxTime;
        pblc.getActiveConnectionsCount = getActiveConnectionsCount;
        pblc.getWaitingConnectionsCount = getWaitingConnectionsCount;
        pblc.onValueChange = bindForeignValueListener;
        pblc.setForeignValueListeners = setForeignValueListeners;
    }

    function setProtectedMembers(){
        // inherit from public
        for(var publicMember in pblc){
            prtktd[publicMember] = pblc[publicMember];
        }

        prtktd.getEventHandler = prtktd.getEventHandler || getEventHandler;

        prtktd.setValue = setValue;
        prtktd.setName = setName;
        prtktd.getNameAndId = getNameAndId;
        prtktd.setInUse = setInUse;
        prtktd.addChild = addChild;
        prtktd.setChild = setChild;
        prtktd.getChild = getChild;
    }

    var initialization = init();
    // if something goes wrong do not return an instance but an object containing information about the error
    if (initialization.error.length) return {error: initialization.error};
    // return the finished object (somewhat an instance of the module object)
    return pblc;
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