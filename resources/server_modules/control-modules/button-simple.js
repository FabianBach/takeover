
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
    var eventHandler,
        mappings,
        value;

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

    // use the information provided in the validated configuration to set and override variables of the object
    function applyConfig (config){

        mappings = config.mapping;

    }

    function setEvents(){
        eventHandler.on('value_change', onValueChange);
    }

    function onValueChange(data){
        var dataLog = checkData(data);
        if (dataLog.error.length) return console.log('Module ' + shared.getNameAndId() + ' received bad data: ', data, dataLog);

        var mappingLog = doMapping(data);
        if (mappingLog.error.length) return console.log('Module ' + shared.getNameAndId() + ' could not map data ', data, mappingLog);

        //return false; // stop the super-object from getting this event
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

    function useDmx (data, mappingData){

        data = parseInt(data);
        var mappedValue;

        if(mappingData.fine){
            mappedValue = getMappedValue(data, mappingData.minValue, mappingData.maxValue);
            var mappedValueCh1 = mappedValue % 255;
            var mappedValueCh2 = mappedValue / 255;
            console.log(shared.getNameAndId() + ' DMX: ' + mappedValueCh1 + ' channel: ' + mappingData.channel);
            console.log(shared.getNameAndId() + ' DMX: ' + mappedValueCh2 + ' channel: ' + mappingData.channel+1);

        }else{
            mappedValue = getMappedValue(data, mappingData.minValue, mappingData.maxValue);
            console.log(shared.getNameAndId() + ' DMX: ' + mappedValue + ' channel: ' + mappingData.channel);
        }
    }

    function useMidi (data, mappingData){

        data = parseInt(data);
        var mapData;
        var foreignModule;
        var foreignValue;
        var type = mappingData.msgType;
        var channel = mappingData.channel;

        var mappedValue1;
        if(mappingData.byte_1.doMapping){
            // get foreign value and map that
            if (mappingData.byte_1.foreignValue){
                foreignModule = shared.getModuleById(mappingData.byte_1.foreignValue);
                foreignValue = foreignModule && foreignModule.value;
                console.log('foreignValue: '.red + foreignValue);
                mapData = foreignValue || data;
            }else{
                mapData = data;
            }
            mappedValue1 = getMappedValue(mapData, mappingData.byte_1.minValue, mappingData.byte_1.maxValue);
        }else{
            mappedValue1 = mappingData.byte_1.value;
        }

        var mappedValue2;
        if(mappingData.byte_2.doMapping){
            // get foreign value and map that
            if (mappingData.byte_2.foreignValue){
                foreignModule = shared.getModuleById(mappingData.byte_2.foreignValue);
                foreignValue = foreignModule && foreignModule.value;
                console.log('foreignValue: '.red + foreignValue);
                mapData = foreignValue || data;
            }else{
                mapData = data;
            }
            mappedValue2 = getMappedValue(mapData, mappingData.byte_2.minValue, mappingData.byte_2.maxValue);
        }else{
            mappedValue2 = mappingData.byte_2.value;
        }

        console.log(shared.getNameAndId() + ' MIDI: ' + type + ' ' + channel + ' ' + mappedValue1 + ' ' + mappedValue2);
    }

    function useOsc (data, mappingData){

    }

    function getMappedValue (modVal, mapMin, mapMax){
        //var modMin = shared.getMinValue();
        var modMax = shared.getMaxValue();

        //var modDelta = modMax - modMin;
        var modPercent = modVal / modMax;

        var mapDelta = mapMax - mapMin;
        var mapValue = mapMin + (mapDelta * modPercent);

        return parseInt(mapValue);

    }

    // getters and setters
    // TODO

    /*
     * ** SHARED STUFF **
     */

    function setShared(){

        // inherit from public
        for(var publicMember in that){
            shared[publicMember] = that[publicMember];
        }

        // vars

        // funcs
        //shared.init = init;
        //shared.doMapping = doMapping;
    }

    /*
     * ** PUBLIC STUFF **
     */
    // now add the functions to the returned object, which are supposed to be public in the interface
    // that.methodName = funcName;
    // TODO

    var initialization = init();
    //if something goes wrong do not return an instance but an object containing information about the error
    if (initialization.error) return {error: initialization.error};
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

        switch (mapping.type){
            case 'midi':
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
                break;

            case 'dmx':
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

                break;

            case 'osc':
                if (!mapping.channel){error.push('No OSC channel defined')}
                if (!mapping.datatype){error.push('No OSC data-type defined')}
                mapping.minValue = mapping.minValue  || 0;
                mapping.maxValue = mapping.maxValue  || 255;
                break;

            default :
                error.push('Unknown mapping type: ' + mapping.type);
        }
    }

    return {error: error};
}

// nice logging
require('colors');