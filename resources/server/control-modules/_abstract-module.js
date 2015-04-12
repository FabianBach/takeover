
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
        disableOnMaxTime,
        inUse,
        inUseSocket,
        isOccupied,
        resolution,
        value,
        minValue,
        maxValue,
        ioSocket,
        ioNamespace,
        activeConnections = {},
        waitingConnections = [],
        disableOnAnimation,
        occupyingAnimationsCount = 0;

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

        setPublicMembers();
        setProtectedMembers();

        // this will do initial stuff e.g. onNoConnections
        moveWaitingline();

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
        isOccupied = false;

        id = config.id;
        name = config.name;
        type = config.type;
        title = config.title;

        // multiple users - if isParent && !isChild only but does not matter
        maxUsers = config.maxUsers;
        maxTime = config.maxTime;
        disableOnMaxTime = config.disableOnMaxTime;
        disableOnAnimation = config.disableOnAnimation;
        activeConnections.sockets = {};
        activeConnections.length = 0;


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
            switch(mapping.type){
                case 'dmx':
                    setListener(mapping.foreignValue, mapping);
                    break;
                case 'midi':
                    setListener(mapping.byte_1.foreignValue, mapping);
                    setListener(mapping.byte_2.foreignValue, mapping);
                    break;
                case 'osc':
                    //TODO: OSC
                    break;
            }

            function setListener(foreignValue, mapping){
                if(foreignValue){
                    prtktd.setForeignListener(foreignValue, function(value){
                        privateEventHandler.emit('foreign_value_change', value, mapping);
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
            console.log('Connected to control ' + getNameAndId() +' socket: '+ socket.id.grey);

            socket.on('disconnect', function(){
                disableSocket(socket);
            });

            // if the max number of users is not reached yet set socket active
            // else put socket in waiting line
            if (!getOccupied().status && activeConnections.length < maxUsers){
                enableSocket(socket);
            }else{
                //putSocketBackInLine(socket);
                putSocketFrontInLine(socket);
            }

            socket.emit('value_update', getValue());

            console.log('maxUsers: ' + maxUsers.toString().cyan, '\tactive: ' + activeConnections.length.toString().cyan, '\twaiting: ' + waitingConnections.length.toString().cyan);

        });

        return {error: error};
    }

    function setSocketTimeout(socket){
        if (maxTime === Infinity){ return }

        // make sure there are no other timeouts set before setting new ones
        clearAllSocketTimeouts(socket);

        return setTimeout(function(){
            onSocketTimeout(socket);
        }, maxTime);
    }

    function clearSocketTimeout(timeout){
        if (maxTime === Infinity){ return }
        clearTimeout(timeout);
    }

    function clearAllSocketTimeouts(socket){
        if (maxTime === Infinity){ return }

        clearSocketTimeout(socket.availableTimeout);
        socket.availableTimeout = null;
        clearSocketTimeout(socket.occupyTimeout);
        socket.occupyTimeout = null;
    }

    function onSocketTimeout(socket){

        //console.log('socketTimeout'.grey);

        if (waitingConnections.length){
            // this will also enable the waiting sockets by moving the waiting line
            setOccupied(false, socket);
        }

        // wait until the socket in use stops using the control, then disable it
        // disable all the sockets which are not using the control immediately
        if(getInUse().socket === socket && !disableOnMaxTime){
            // if the socket is is use
            // and the control is not set to disable immediately:
            if (!socket.useEndListenerSet){
                socket.on('use_end', timeoutMaybeDisable);
                socket.useEndListenerSet = true;
            }

            socket.occupyTimeout = setSocketTimeout(socket);

        } else if (!waitingConnections.length){
            // if the socket is enabled but not in use
            // but other socket is waiting to get enabled
            // we just check back again later
            socket.availableTimeout = setSocketTimeout(socket);

        } else {
            // if other sockets are waiting to get enabled
            // and this socket is not using the control:
            timeoutDisable()
        }


        function timeoutMaybeDisable(){
            if (waitingConnections.length){
                timeoutDisable()
            } else {
                socket.availableTimeout = setSocketTimeout(socket);
            }
        }

        function timeoutDisable(){
            // remove the callback to this function
            socket.removeListener('use_end', timeoutMaybeDisable);
            socket.useEndListenerSet = false;
            // the following will also disable the socket and set inUse to false
            putSocketBackInLine(socket);
        }
    }

    function enableSocket(socket){
        activeConnections.sockets[socket.id] = socket;
        activeConnections.length = activeConnections.length + 1;

        //console.log(getNameAndId() + ' enabling a socket ' + socket.id);

        socket.on('in_use', function(){
            setInUse(true, socket);
        });

        socket.on('value_change', function(data){
            setValue(data, socket);
        });

        socket.on('use_end', function(){
            //console.log('socket use_end'.red);
            setInUse(false, socket);
        });

        sharedEventHandler.emit('socket_enabled', socket);
        socket.emit('enable', getValue());

        socket.availableTimeout = setSocketTimeout(socket);

        return socket;
    }

    function putSocketFrontInLine(socket){

        //console.log(getNameAndId() + ' front in line ' + socket.id);

        disableSocket(socket);
        // push it back in waiting line if still connected
        if(socket.connected){
            waitingConnections.unshift(socket);
        }
    }

    function putSocketBackInLine(socket){

        //console.log(getNameAndId() + ' back in line ' + socket.id);

        disableSocket(socket);
        // push it back in waiting line if still connected
        if(socket.connected){
            waitingConnections.push(socket);
        }
    }

    // will disable its interface on the client
    function disableSocket(socket){

        // make sure we do not react to any events of disabled sockets
        socket.removeAllListeners('value_change');
        socket.removeAllListeners('in_use');
        socket.removeAllListeners('use_end');

        // also do not react to timeouts of disabled sockets
        clearAllSocketTimeouts(socket);

        // tell the socket it has been disabled
        socket.emit('disable');

        // remove the disabled socket from active list if it was active
        if(activeConnections.sockets[socket.id]){

            // if the socket was not only active but also using the control at the moment
            // we have to be careful to not forget to clean up because it could not do it itself
            if(getInUse().status && getInUse().socket && (socket.id === getInUse().socket.id)){
                //console.log('socket_in_use_disabled'.red);

                if (!getOccupied().status){
                    setInUse(false, socket);
                }

                sharedEventHandler.emit('socket_in_use_disabled', socket);
            }

            // finally remove it from the active list
            delete activeConnections.sockets[socket.id];
            activeConnections.length = activeConnections.length - 1;
        }

        // also tell children, might come in handy some time
        sharedEventHandler.emit('socket_disabled', socket);
    }

    // this will step trough the waiting list until it finds a connected socket
    // this socket will then be made active
    function moveWaitingline(){

        //console.log('waiting line moving...'.yellow + getNameAndId());

        if (!activeConnections.length && waitingConnections.length === 1) {
            console.log('First connection to '.yellow + getNameAndId());
            sharedEventHandler.emit('first_connection');
        }

        for(var a = activeConnections.length;
            a < (maxUsers + getInUse().status)
            && waitingConnections.length > 0;
            a = activeConnections.length){

            var socket = waitingConnections.shift();
            if (socket.connected){
                enableSocket(socket);
            }
        }

        if (!activeConnections.length) {
            console.log('No connections to '.yellow + getNameAndId());
            sharedEventHandler.emit('no_connections');
        }

        //console.log('... waiting line moved'.yellow + getNameAndId());

    }

    function setEvents(){
        privateEventHandler.on('value_change', onValueChange);
        privateEventHandler.on('foreign_value_change', onForeignValueChange);

        sharedEventHandler.on('in_use', onUse);
        sharedEventHandler.on('use_end', onUseEnd);

        sharedEventHandler.on('on_occupie', onOccupy);
        sharedEventHandler.on('occupie_end', onOccupyEnd);

        sharedEventHandler.on('no_connections', onNoConnections);
        sharedEventHandler.on('first_connection', onFirstConnection);
    }

    // this will notify foreign control modules about any value change
    // the foreign modules just leaves its callback
    function bindForeignValueListener(listener){
        privateEventHandler.on('value_change', listener);
    }

    // gets invoked when a client sends a new value for the module
    // should check if value is a valid one and then call mapping
    function onValueChange (value, socket){

        //console.log('Control ' + getNameAndId() + ' value: ', value);
        //console.log('Socket ' + socket.id);

        var dataLog = checkRecievedData(value);
        if (dataLog.error.length){ console.log('Control ' + prtktd.getNameAndId() + ' received bad value: ', value, dataLog)};
        var checkedData = dataLog.data;

        //console.log(getNameAndId() + ' checked data:', checkedData);

        if (isParent){
            for(var childName in childObjs){
                var child = childObjs[childName];
                var val = checkedData[childName];

                if(!child || val === undefined){
                    console.log('WARNING:'.yellow, 'no child or value with that name:', childName);
                    break;
                }
                child.setValue(val, socket);
            }
        }

        if(!isChild){
            if (socket && socket.broadcast){
                socket.broadcast.emit('value_update', checkedData);

            } else {
                ioNamespace.emit('value_update', checkedData);
            }
        }

        if (!isParent) {
            var processLog = processValue(checkedData, true);
            if (processLog.error.length) return console.log('Control ' + prtktd.getNameAndId() + ' could not map value ', checkedData, processLog);
        }
    }

    function onForeignValueChange (value, mapping){
        // only gets set and called if it is not a parent
        // will do mapping with the actual value to update foreign value mappings
        // console.log('Control ' + prtktd.getNameAndId() + ' | foreign Value Change', value);
        if(!getInUse().status){ return; }
        var mappingLog = mapper.doMapping(getValue(), getMaxValue(), [mapping] );
        if (mappingLog.error.length) return console.log('Control ' + prtktd.getNameAndId() + ' could not map value ', value, mappingLog);
    }

    function processValue (value, doTriggerAnimations){
        // only called if it is not a parent
        //console.log('Control ' + getNameAndId() + ' value: ', value);
        var error = [];

        var mapLog = mapper.doMapping(value, getMaxValue(), mappings);
        if (mapLog.error.length){ error.push(mapLog.error); }

        if(doTriggerAnimations){
            var animationLog = triggerAnimations(value);
            if (animationLog.error.length){ error.push(animationLog.error); }
        }

        return {error: error};
    }

    // this function is supposed to check if the data is okay or if something messed up
    // it could also correct the data in the object if an minor error is found and log a warning
    function checkRecievedData (data){
        var error = [];
        var checkedData = {};

        // parent can not do it, has to be done by children
        if (isParent){
            var children = getChildren();
            for(var childName in children){
                var child = getChild(childName);
                if (!child){ return }

                var checkLog = child.checkRecievedData(data[childName]);
                if (checkLog.error.length) {
                    error.push(checkLog.error);
                }
                checkedData[childName] = checkLog.data;
            }
        }

        // if we are last in line we can validate the data
        if (!isParent){
            var parsedData = parseInt(data);
            if (isNaN(parsedData)){
                error.push('Bad data recieved:' + data)
                checkedData = getMinValue();
            } else {
                parsedData = parsedData > getMaxValue() ? getMaxValue() : parsedData;
                parsedData = parsedData < getMinValue() ? getMinValue() : parsedData;
                checkedData = parsedData;
            }
        }

        return {error: error, data: checkedData}
    }

    function onUse(socket){
        //console.log('onUse'.red);
        setOccupied(true, socket);
    }

    function onUseEnd(socket){
        //console.log('onUseEnd'.red);
        setOccupied(false, socket);
    }

    function onOccupy(socket){
        //console.log('onOccupy'.red + 'socket: ' + !!socket);

        if(socket){
            clearSocketTimeout(socket.availableTimeout);
            socket.occupyTimeout = socket.occupyTimeout || setSocketTimeout(socket);
        }

        if (!isChild){

            var disableArray = [];
            for(var someSocketId in activeConnections.sockets){
                var someSocket = activeConnections.sockets[someSocketId];
                if ((someSocket.id !== (socket && socket.id))){
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

            if (socket) {
                // client triggered event
                socket.broadcast.emit('occupied', getOccupied().status);

            } else {
                // server triggered event
                //console.log('Namespace emits occupied '.red, getOccupied().status);
                ioNamespace.emit('occupied', getOccupied().status);
            }
        }
    }

    function onOccupyEnd(socket){
        //console.log('onOccupyEnd'.red);
        if (!isChild){
            moveWaitingline();
        }
    }

    function onNoConnections(){
        // TODO: apply special mapping on no client connected
    }

    function onFirstConnection(){
        // TODO: apply special mapping when first client is connected
    }

    function triggerAnimations(){
        var error = [];

        for (var animation in animations){

            var animationConfig = animations[animation];

            if ( (getValue() !== 0) || animationConfig.triggerOnZero){

                // callbacks are defined each time a animation is triggered
                // but that is okay, because the old callback will be overwritten
                animator.triggerAnimation(animationConfig,
                    onUpdateCallback.bind(null, animationConfig),
                    onCompleteCallback.bind(null, animationConfig));

                // if animation is not cancelable or if control config is set to do so
                // then occupy this control
                if (disableOnAnimation){
                    //console.log('Animation sets control occupied'.red);
                    setOccupied(true);
                    occupyingAnimationsCount++;
                }
            }
        }

        function onUpdateCallback(animationConfig, newValue, oldValue){
            animationConfig.value = newValue;
            mapper.doMapping(0, 0, [animationConfig]);
        }

        function onCompleteCallback(animationConfig){
            if (disableOnAnimation){
                occupyingAnimationsCount--;
                if(!occupyingAnimationsCount){
                    //console.log('Animation frees control from occupied'.red);
                    setOccupied(false);
                }
            }
        }

        return {error: error};
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

    function setValue(data, socket){
        value = data;
        privateEventHandler.emit('value_change', data, socket);
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
        socket = socket ||null;

        if (inUse){
            inUseSocket = socket;
            sharedEventHandler.emit('in_use', socket);
        } else {
            inUseSocket = null;
            sharedEventHandler.emit('use_end', socket);
        }
    }

    function getOccupied(){
        return {
            status: !!isOccupied,
            socket: getInUse().socket
        }
    }

    function setOccupied(status, socket){

        socket = socket || null;
        isOccupied = status;

        if (getOccupied().status){
            sharedEventHandler.emit('on_occupie', socket);
        } else {
            sharedEventHandler.emit('occupie_end', socket);
        }
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

    function getChildren(){
        return childObjs;
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
        pblc.getOccupied = getOccupied;
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
        prtktd.checkRecievedData = checkRecievedData;
        prtktd.setName = setName;
        prtktd.getNameAndId = getNameAndId;
        prtktd.setInUse = setInUse;
        prtktd.setOccupied = setOccupied;
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