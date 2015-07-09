// Control Module - Basic Abstract Module
// This function will return a new object
// with private and public and protected methods.
// It is configured by handing in a pojo.
// This function works somehow like a factory.
var abstractModule = function(config, prtktd){

    /* ** Everything is PRIVATE ** */
    // Everything inside this function is private.
    // Public methods have to be added to the public object.
    // Protected methods have to be added to the protected object.

    // The protected methods are realised by passing them around in a object.
    // This object will be provided by and to any child-module that inherits from this module.
    prtktd = prtktd || {};

    // The public methods are collected in a object that will be returned at the end.
    var pblc;

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
        maxConnections = 0,
        waitingConnections = [],
        disableOnAnimation,
        occupyingAnimationsCount = 0;

    var privateEventHandler, // for modules internally
        sharedEventHandler, // for inheriting parent and child modules
        globalEventHandler, // for all modules globally
        validator,
        mapper,
        animator;

    // This function will be called at first.
    // Somehow like a constructor inside a constructor.
    // It will validate the configuration and set the super object to inherit from
    var init = function(){

        // get references to all needed modules
        validator = require(global.tkvrBasePath + '/resources/server/validation-module');
        mapper = require(global.tkvrBasePath + '/resources/server/mapping-module');
        animator = require(global.tkvrBasePath + '/resources/server/animation-module');

        // validate and correct and apply the configuration
        var validationLog = validator.validateConfig(config);
        if (validationLog.error.length) return {error: validationLog.error};
        applyConfig(config);

        // open a new namespace for websockets
        if (!isChild){
            var socketLog = createSocket(config.io);
            if (socketLog.error.length) return {error: socketLog.error};
        }

        //
        setEvents();
        setPublicMembers();
        setProtectedMembers();

        // this will trigger some initial events
        // e.g. onNoConnections
        moveWaitingline();

        // TODO: this is not really useful like that
        return {error: []};
    };

    // Use the information provided in the validated configuration
    // to set and override variables of the module
    // and also set some default values
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
        value = minValue; //TODO: initial value in config

        mappings = config.mapping;
        animations = config.animation;
    }

    // Make the module listen to all the stuff that happens
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

    // This makes it possible to use the foreignValue option in the config.
    // The function steps through all the mappings and checks for the foreignValue option.
    function setForeignValueListeners(){
        if (isParent){
            return;
        }

        for (var i = 0; i < mappings.length; i++){
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
                    setListener(mapping.foreignValue, mapping);
                    break;
            }

            // The setForeignValueListener function is provided by the control factory.
            // This module does not has to know where to find the foreign value.
            // All it does is placing a callback and wait for it to be called.
            // The callback then fires an private event which the modules reacts to.
            function setListener(foreignValue, mapping){
                if(foreignValue){
                    prtktd.setForeignListener(foreignValue, function(value){
                        privateEventHandler.emit('foreign_value_change', value, mapping);
                    });
                }
            }
        }
    }

    // This will create a new namespace for client sockets to connect directly to the server part of this module.
    // It will also handle the connecting sockets and save the references.
    // Also, the connections will be set active or put in the waiting line.
    function createSocket (io){
        var error = [];

        if(isChild){
            return {error: error};
        }

        // Creates a new and unique namespace using the unique id of the module.
        ioSocket = io;
        ioNamespace = io.of(getNamespace());

        // Listen to client connections to the namespace
        ioNamespace.on('connection', function(socket){
            console.log('Connected to control ' + getNameAndId() +' socket: '+ socket.id.grey);

            socket.on('disconnect', function(){
                disableSocket(socket);
            });

            // Fires an event if no socket was connected at all until now
            if (!activeConnections.length) {
              console.log('First connection to '.yellow + getNameAndId());
              sharedEventHandler.emit('first_connection');
            }

            // If the max number of users is not reached yet
            // and the socket is currently not occupied set socket active.
            // Else put socket in the waiting line.
            if (!getOccupied().status && activeConnections.length < maxUsers){
                enableSocket(socket);
            }else{
                // putSocketBackInLine(socket);
                putSocketFrontInLine(socket);
            }

            // Initial value update for new client
            socket.emit('value_update', getValue());

            var totalConnections = activeConnections.length + waitingConnections.length;
            maxConnections = ((maxConnections < totalConnections) ? totalConnections : maxConnections);
            console.log('maxUsers: ' + maxUsers.toString().cyan, '\tactive: ' + activeConnections.length.toString().cyan, '\twaiting: ' + waitingConnections.length.toString().red, '\tHIGHEST: ' + maxConnections.toString().yellow);
        });

        return {error: error};
    }

    // There are two types of timeouts:
    // The available timeout defines how much time the user has to start using the module.
    // The occupy timeout defines how long the user can then use the module exclusively.

    // This timeout is used to not let an user occupy the control module for ever ever, for ever ever?
    // Also used to move inactive users to the waiting line.
    function setSocketTimeout(socket){
        if (maxTime === Infinity){ return }

        // make sure there are no other timeouts set
        // before setting new ones
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

    // This will also enable the waiting sockets by moving the waiting line
    function onSocketTimeout(socket){
        if (waitingConnections.length){
            setOccupied(false, socket);
        }

        // If the user is still using the control module,
        // do not disable him immediately if not configured.
        if(getInUse().socket === socket && !disableOnMaxTime){

            // Wait until user stops using the module after timeout.
            // Set listener only once.
            if (!socket.useEndListenerSet){
                socket.on('use_end', timeoutMaybeDisable);
                socket.useEndListenerSet = true;
            }
            // set occupy timeout again to check back again later when things might have changed
            socket.occupyTimeout = setSocketTimeout(socket);

        // If the module is not in use anymore, but there are no waiting connections,
        // just leave it available to use for that client
        } else if (!waitingConnections.length){
            // set available timeout to check back again later when things might have changed
            socket.availableTimeout = setSocketTimeout(socket);

        // If the module is not in use and some users are waiting to get it available
        // put that socket back in line, he has had enough time to start using it
        } else {
            timeoutDisable()
        }


        // This checks if the module is disabled or still available
        // to a socket when it stops using it after its occupy timeout
        function timeoutMaybeDisable(){
            if (waitingConnections.length){
                timeoutDisable()
            } else {
              // set available timeout to check back again later when things might have changed
              socket.availableTimeout = setSocketTimeout(socket);
            }
        }

        // disables the socket, if it wants or not.
        function timeoutDisable(){
            socket.removeListener('use_end', timeoutMaybeDisable);
            socket.useEndListenerSet = false;
            // will disable the socket and set inUse to false
            putSocketBackInLine(socket);
        }
    }

    // Enables a socket to let him start using this control module.
    // It starts listening to all its events
    // and tells the socket it has been enabled.
    function enableSocket(socket){
        activeConnections.sockets[socket.id] = socket;
        activeConnections.length = activeConnections.length + 1;

        socket.on('in_use', function(){
            setInUse(true, socket);
        });

        socket.on('value_change', function(data){
            setValue(data, socket);
        });

        socket.on('use_end', function(){
            setInUse(false, socket);
        });

        // Let children know what happens
        sharedEventHandler.emit('socket_enabled', socket);
        // Let that socket know it is enabled and whats that actual value
        socket.emit('enable', getValue());
        // Set available timeout to put him back in the waiting line
        // if he does not start using the module.
        socket.availableTimeout = setSocketTimeout(socket);

        return socket;
    }

    // Puts a socket IN FRONT of the waiting line,
    // so it gets to use it next
    function putSocketFrontInLine(socket){
        disableSocket(socket);
        if(socket.connected){
            waitingConnections.unshift(socket);
        }
    }

    // Puts a socket IN BACK of the waiting line,
    // so it has to wait till all the other sockets had a turn
    function putSocketBackInLine(socket){
        disableSocket(socket);
        if(socket.connected){
            waitingConnections.push(socket);
        }
    }

    // Will remove all the listeners for socket sent events,
    // so what ever it will send will be ignored.
    // It will also tell the socket that it has been disabled.
    function disableSocket(socket){

        // Make sure we ignore any events of disabled sockets
        socket.removeAllListeners('value_change');
        socket.removeAllListeners('in_use');
        socket.removeAllListeners('use_end');

        // Also ignore timeouts of disabled sockets
        clearAllSocketTimeouts(socket);

        // Tell the socket it has been disabled
        socket.emit('disable');

        // Remove the disabled socket from active list if it was active
        if(activeConnections.sockets[socket.id]){

            // if the socket was not only active but also using the control at the moment
            // we have to be careful to not forget to clean up because it could not do it itself
            if(getInUse().status && getInUse().socket && (socket.id === getInUse().socket.id)){

                //if (!getOccupied().status){
                    setInUse(false, socket);
                //}
                // Tell the children what did happen
                sharedEventHandler.emit('socket_in_use_disabled', socket);
            }

            // Finally remove that socket from the active list
            delete activeConnections.sockets[socket.id];
            activeConnections.length = activeConnections.length - 1;
        }

        // Also tell children what is happening
        sharedEventHandler.emit('socket_disabled', socket);
    }

    // This will step trough the waiting list until it finds a connected socket.
    // This socket will then be made active and moved to the active list.
    function moveWaitingline(){

        // Step through the waiting list until
        // the active list reached its maximum
        // or the waiting list has no more entries
        for ( var a = activeConnections.length;
              a < (maxUsers + getInUse().status)
              && waitingConnections.length > 0;
              a = activeConnections.length) {

            var socket = waitingConnections.shift();
            if (socket.connected){
                enableSocket(socket);
            }
        }

        // If we do not have any connected sockets, we fire an event.
        // We could start some animation with that or trigger some special mapping.
        if (!activeConnections.length) {
            console.log('No connections to '.yellow + getNameAndId());
            sharedEventHandler.emit('no_connections');
        }
    }

    // This will notify foreign control modules about any value change.
    // The foreign modules just leaves its callback which will then be invoked.
    function bindForeignValueListener(listener){
        privateEventHandler.on('value_change', listener);
    }

    // Gets called when the value of the module has changed.
    function onValueChange (value, socket){

        var dataLog = checkRecievedData(value);
        if (dataLog.error.length){ console.log('Control ' + prtktd.getNameAndId() + ' received bad value: ', value, dataLog)}
        var checkedData = dataLog.data;

        // if this module is a parent, we give the received data down to the children
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

        // if this module is not a child (maybe a parent, maybe standalone), we emit the new value to all the clients
        if(!isChild){
            if (socket && socket.broadcast){
                //TODO: do send it but with with timeout only or something to use less network
                socket.broadcast.emit('value_update', checkedData);

            } else {
                ioNamespace.emit('value_update', checkedData);
            }

            //console.log(getName().grey, 'val', checkedData);
        }

        // if this module is not a parent (maybe a child, maybe standalone), we process the new value (mapping, animations, etc)
        if (!isParent) {
            var processLog = processValue(checkedData, true);
            if (processLog.error.length) return console.log('Control ' + prtktd.getNameAndId() + ' could not map value ', checkedData, processLog);
        }
    }

    // only gets set and called if it is not a parent
    // will do mapping with the actual value to update foreign value mappings
    function onForeignValueChange (value, mapping){
        // console.log('Control ' + prtktd.getNameAndId() + ' | foreign Value Change', value);
        if(!getInUse().status){ return; }
        var mappingLog = mapper.doMapping(getValue(), getMaxValue(), [mapping] );
        if (mappingLog.error.length) return console.log('Control ' + prtktd.getNameAndId() + ' could not map value ', value, mappingLog);
    }

    // only called if it is not a parent on value change
    // will do mappings and trigger animations
    function processValue (value, doTriggerAnimations){
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

        // if we are last in line (no children) we can validate the data
        if (!isParent){
            var parsedData = parseInt(data);
            if (isNaN(parsedData)){
                error.push('Bad data recieved:' + data);
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

        // if the module is occupied by an socket we start the countdown for the exclusive use time
        if(socket){
            clearSocketTimeout(socket.availableTimeout);
            socket.occupyTimeout = socket.occupyTimeout || setSocketTimeout(socket);
        }

        // if it is a parent or standalone module we tell all the sockets about the occupation
        if (!isChild){

            // first we filter the sockets we have to disable
            // we have to disable them after filtering them
            // because we would manipulate the object while stepping through it
            var disableArray = [];
            for(var someSocketId in activeConnections.sockets){
                var someSocket = activeConnections.sockets[someSocketId];
                if ((someSocket.id !== (socket && socket.id))){
                    disableArray.push(someSocket);
                }
            }

            // now step through the filtered object and disable the sockets
            for(var i=0; i < disableArray.length; i++){
                var disableSocket = disableArray[i];
                putSocketFrontInLine(disableSocket);
            }

            // if a socket occupies the module
            if (socket) {
                socket.broadcast.emit('occupied', getOccupied().status);

            // if a animation or the system occupies the module
            } else {
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

        // gets called when ever the animation has reached a new value
        // we will then use the mapper to write the new value to the protocols
        function onUpdateCallback(animationConfig, newValue, oldValue){
            animationConfig.value = newValue;
            mapper.doMapping(0, 0, [animationConfig]);
        }

        // gets called when the animation reaches its end
        // will stop occupation of the module when last animation has finished
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
        if (value === data){ return; }
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