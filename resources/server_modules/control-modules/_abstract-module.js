
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
        eventHandler,
        mappings,
        dmx,
        universe;

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

        mappings = config.mapping;

        dmx = config.dmx;
        universe = config.universe;

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

        data = data[0];

        var dataLog = checkData(data);
        if (dataLog.error.length) return console.log('Module ' + shared.getNameAndId() + ' received bad data: ', data, dataLog);

        setValue(data, false);

        var mappingLog = doMapping(data);
        if (mappingLog.error.length) return console.log('Module ' + shared.getNameAndId() + ' could not map data ', data, mappingLog);

        // ioNamespace.emit('value_update', getValue()); sends the new value out
    }

    // this function is supposed to map the received value to the different protocol values
    // according to the mapping object defined in the config
    // this method has to be defined by each specific module itself
    // there is no general way to do this in this abstract object
    function doMapping (data){
        console.log('Module ' + getNameAndId() + ' value: ', data);
        var error = [];

        for(var i = 0; i < mappings.length; i++){
            var mapping = mappings[i];

            switch (mapping.type){

                case 'dmx':
                    useDmx(data, mapping);
                    break;

                case 'midi':
                    useMidi(data, mapping);
                    break;

                case 'osc':
                    useOsc(data, mapping);
                    break;

                default :
                    error.push('Can not map to: '+ mapping.type);
            }
        }

        return {error: error}
    }

    // this function is supposed to check if the data is okay or if something messed up
    // it could also correct the data in the object if an minor error is found and log a warning
    function checkData (data){
        // TODO
        return {error: []}
    }

    // MIDI, DMX and OSC

    // DMX
    function useDmx (data, mappingData){

        //TODO: foreign value?

        data = parseInt(data);
        var mappedValue;

        mappedValue = getMappedValue(data, getMaxValue(), mappingData.minValue, mappingData.maxValue);
        if(mappingData.fine){
            var mappedValueCh1 = mappedValue % 255;
            var mappedValueCh2 = mappedValue / 255;
            sendDmx({
                channel: mappingData.channel,
                value: mappedValueCh1
            });
            sendDmx({
                channel: mappingData.channel+1,
                value: mappedValueCh2
            });
        }else{
            sendDmx({
                channel: mappingData.channel,
                value: mappedValue
            });
        }
    }

    // MIDI
    function useMidi (data, mappingData){

        data = parseInt(data);
        var type = mappingData.msgType;
        var channel = mappingData.channel;
        var mappedValue1 = getMappedMidiValue(mappingData.byte_1, data);
        var mappedValue2 = getMappedMidiValue(mappingData.byte_2, data);

        function getMappedMidiValue(mapping, data){
            var mappedValue,
                mapData,
                mapMax;

            if(mapping.doMapping){
                // get foreign value and map that
                if (mapping.foreignValue){
                    var foreignModule = shared.getModuleById(mapping.foreignValue);
                    var foreignValue = foreignModule && foreignModule.value;
                    var foreignMax = foreignModule && foreignModule.maxValue;
                    mapData = foreignValue || data;
                    mapMax = foreignMax || getMaxValue();
                }else{
                    mapData = data;
                    mapMax = getMaxValue()
                }
                mappedValue = getMappedValue(mapData, mapMax, mapping.minValue, mapping.maxValue);
            }else{
                mappedValue = mapping.value;
            }
            return mappedValue;
        }

        sendMidi({
            type: type,
            channel: channel,
            value1: mappedValue1,
            value2: mappedValue2
        });
    }

    // OSC
    function useOsc (data, mappingData){
        console.log('OSC not implemented yet!'.red, data);
        sendOsc(data);
    }

    function sendDmx (dmxObj){
        console.log('DMX: ' + dmxObj.value + ' channel: ' + dmxObj.channel);
        if (!dmx){ return }
        var sendObj = {};
        sendObj[parseInt(dmxObj.channel)-1] = dmxObj.value;
        console.log(sendObj);
        //dmx.update('takeover', {2: dmxObj.value});
        universe.update(sendObj);
    }

    function sendMidi (midiObj){
        console.log('MIDI: ' + midiObj.type + ' ' + midiObj.channel + ' ' + midiObj.value1 + ' ' + midiObj.value2);
    }

    function sendOsc (oscObj){
        console.log('OSC: ' + oscObj);
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

    function setValue(data, fireEvent){
        value = data;
        if (fireEvent === false){ return; }
        fireValueChange(data);
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

    /*
     * ** PUBLIC STUFF **
     */
    // now add the functions to the returned object, which are supposed to be public in the interface
    // that.methodName = funcName;

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

    /*
     * ** SHARED STUFF **
     */
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
    // none

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

// these functions will send the mapped data to the external devices
// or if no device is available they will just log it or do something else... like nothing

// takes the actual and the maximum value of the module
// to return the actual value of the mapped min and max
function getMappedValue (modVal, modMax, mapMin, mapMax){

    var modPercent = modVal / modMax;

    var mapDelta = mapMax - mapMin;
    var mapValue = mapMin + (mapDelta * modPercent);

    return parseInt(mapValue);
}

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

    // MAPPING
    if (config.mapping){
        var mappingLog = validateMapping(config.mapping);
        if (mappingLog.error.length){ error.push({'mappingError': mappingLog.error});}
    }

    return {error: error};
}

function validateMapping(mappingConfig){

    var error = [];

    for(var i = 0; i < mappingConfig.length; i++){
        var mapping = mappingConfig[i];
        if (!mapping.type){
            error.push('No mapping type defined');
            break
        }
        mapping.type = mapping.type.toLowerCase();

        var log ={};
        switch (mapping.type){
            case 'midi':
                log = validateMidiMapping(mapping);
                break;

            case 'dmx':
                log = validateDmxMapping(mapping);
                break;

            case 'osc':
                log = validateOscMapping(mapping);
                break;

            default :
                error.push('Unknown mapping type: ' + mapping.type);
        }
        error = log.error;
    }

    return {error: error};
}

function validateMidiMapping(mapping){
    var error = [];

    // message type
    mapping.msgType = mapping.msgType && mapping.msgType.toLowerCase() || 'note on';

    // channel
    if (!mapping.channel) {error.push('No MIDI channel defined in mapping.')}
    else{
        mapping.channel = parseInt(mapping.channel);
        if (mapping.channel < 1){ mapping.channel = 1}
        if (mapping.channel > 16){ mapping.channel = 16}
    }

    // byte_1
    mapping.byte_1 = mapping.byte_1 || {"doMapping" : true, "minValue": 0, "maxValue": 127};
    mapping.byte_1.doMapping = mapping.byte_1.doMapping || false;
    if (mapping.byte_1.doMapping){
        //minimum value
        mapping.byte_1.minValue = parseInt(mapping.byte_1.minValue) || 0;
        if (mapping.byte_1.minValue < 0){ mapping.byte_1.minValue = 0 }
        if (mapping.byte_1.minValue > 127){ mapping.byte_1.minValue = 127 }
        //maximum value
        mapping.byte_1.maxValue = parseInt(mapping.byte_1.maxValue) || 0;
        if (mapping.byte_1.maxValue < 0){ mapping.byte_1.maxValue = 0 }
        if (mapping.byte_1.maxValue > 127){ mapping.byte_1.maxValue = 127 }

        if (mapping.byte_1.minValue === mapping.byte_1.maxValue){error.push("minValue and maxValue are the same")}
    }else{
        mapping.byte_1.value = parseInt(mapping.byte_1.value || mapping.byte_1.maxValue || mapping.byte_1.minValue || 0);
        if (mapping.byte_1.value < 0){ mapping.byte_1.value = 0 }
        if (mapping.byte_1.value > 127){ mapping.byte_1.value = 127 }
    }
    // byte_2
    mapping.byte_2 = mapping.byte_2 || {"doMapping" : true, "minValue": 0, "maxValue": 127};
    mapping.byte_2.doMapping = mapping.byte_2.doMapping || false;
    if (mapping.byte_2.doMapping){
        //minimum value
        mapping.byte_2.minValue = parseInt(mapping.byte_2.minValue) || 0;
        if (mapping.byte_2.minValue < 0){ mapping.byte_2.minValue = 0 }
        if (mapping.byte_2.minValue > 127){ mapping.byte_2.minValue = 127 }
        //maximum value
        mapping.byte_2.maxValue = parseInt(mapping.byte_2.maxValue) || 0;
        if (mapping.byte_2.maxValue < 0){ mapping.byte_2.maxValue = 0 }
        if (mapping.byte_2.maxValue > 127){ mapping.byte_2.maxValue = 127 }

        if (mapping.byte_2.minValue === mapping.byte_2.maxValue){error.push("minValue and maxValue are the same")}
    }else{
        mapping.byte_2.value = parseInt(mapping.byte_2.value || mapping.byte_2.maxValue || mapping.byte_2.minValue || 0);
        if (mapping.byte_2.value < 0){ mapping.byte_2.value = 0 }
        if (mapping.byte_2.value > 127){ mapping.byte_2.value = 127 }
    }

    return {error: error};
}

function validateDmxMapping(mapping){
    var error = [];

    if (!mapping.channel){ error.push('No DMX channel defined')}
    else{
        mapping.channel = parseInt(mapping.channel);
        if (mapping.channel < 1){ mapping.channel = 1}
        if (mapping.channel > 512){ mapping.channel = 512}
    }
    mapping.minValue = parseInt(mapping.minValue  || 0);
    if(mapping.fine){
        mapping.maxValue = parseInt(mapping.maxValue  || 255*255);
    }else{
        mapping.maxValue = parseInt(mapping.maxValue  || 255);
    }

    if (mapping.minValue === mapping.maxValue){error.push("minValue and maxValue are the same")}

    return {error: error};
}

function validateOscMapping(mapping){
    var error = [];

    if (!mapping.channel){error.push('No OSC channel defined')}
    if (!mapping.datatype){error.push('No OSC data-type defined')}
    mapping.minValue = mapping.minValue  || 0;
    mapping.maxValue = mapping.maxValue  || 255;

    return {error: error};
}


// nice logging
require('colors');