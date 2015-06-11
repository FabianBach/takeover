
// this function will check for errors in the config object
// this will only check values which all modules have in common
// every module will have to check for its specific config values
function validateControlConfig(config){

    var error = [];

    // config itself
    if (!config){
        error.push('No config found!');
        config = {};
    }

    // socket instance
    if (!config.io){ error.push('No io in config')}

    // id, create if missing
    if (!config.id){ config.id = parseInt(Math.random() * new Date().getTime() * 10000000).toString(36).toUpperCase(); }

    // name
    if (!config.name){ config.name = 'unnamed' }
    else {config.name = String(config.name)}

    // type
    if (!config.type){ error.push('No type in config') }
    config.type = config.type.toLowerCase();

    // title
    if (!config.title){ config.title = ''}

    // multiple users
    config.maxUsers = parseInt(config.maxUsers) || Infinity;

    // max use time
    config.maxTime = parseInt(config.maxTime) * 1000 || Infinity;

    // disable on max use time
    config.disableOnMaxTime = !!config.disableOnMaxTime;

    // disable while animations are running
    config.disableOnAnimation = !!config.disableOnAnimation;

    // resolution
    config.resolution = parseInt(config.resolution || 100);

    // MAPPING
    if (config.mapping){
        var mappingLog = validateMapping(config.mapping);
        if (mappingLog.error.length){ error.push({'mappingError': mappingLog.error});}
    } else {
        config.mapping = [];
    }

    // ANIMATION
    if (config.animation){
        var animationLog = validateAnimation(config.animation);
        if (animationLog.error.length){ error.push({'animationError': animationLog.error});}
    } else {
        config.animation = [];
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
        mapping.invert = !!mapping.invert;

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

    mapping.byte_1 = validateByte(mapping.byte_1);
    mapping.byte_2 = validateByte(mapping.byte_2);

    function validateByte(byte){
        byte = byte || {"doMapping" : false, "value": 0};
        byte.doMapping = byte.doMapping || false;
        if (byte.doMapping){
            //minimum value
            byte.minValue = parseInt(byte.minValue) || 0;
            if (byte.minValue < 0){ byte.minValue = 0 }
            if (byte.minValue > 127){ byte.minValue = 127 }
            //maximum value
            byte.maxValue = parseInt(byte.maxValue) || 0;
            if (byte.maxValue < 0){ byte.maxValue = 0 }
            if (byte.maxValue > 127){ byte.maxValue = 127 }

            if (byte.minValue === byte.maxValue){error.push("minValue and maxValue are the same")}
        }else{
            byte.value = parseInt(byte.value || byte.maxValue || byte.minValue || 0);
            if (byte.value < 0){ byte.value = 0 }
            if (byte.value > 127){ byte.value = 127 }
        }

        return byte;
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

function validateGeneralMapping(mapping){
    // TODO: validate general mapping stuff like:

    // if minVal === maxVal -> doMapping = false -> value = minVal;
    // if !minVal -> check if val > minVal -> maxVal = val
    // if !maxVal -> check if val < maxVal -> minVal = val

    // invert = !!invert
}

function validateAnimation(animations){

    for (var animation in animations){
        var animationConfig = animations[animation];

        animationConfig.doMapping = false;
        animationConfig.startValue = animationConfig.startValue || 0;
        animationConfig.value = animationConfig.startValue;

        animationConfig.triggerOnZero = !!animationConfig.triggerOnZero || false;

    }
    // TODO: validate steps
    // TODO: check-correct if times and values are integers
    // check-correct if values are not < 0 or > dmxMax or MidiMax
    // check-correct if type is defined in each step
    // check by using general mapping validator

    var error = [];
    return {error: error};
}

var that = {};

that.validateConfig = validateControlConfig;
that.validateMapping = validateMapping;
that.validateAnimation = validateAnimation;

module.exports = that;
// TODO: Validate View