// this module is supposed to map the received value to the different protocol values
// according to the mapping object defined in the config
// this method has to be defined by each specific module itself

//TODO: maybe split up in mapper and sender

var dmx;
var midi;
var osc;

var controlModule = require(global.tkvrBasePath + '/resources/server/control-module.js');

function init (config, callback){
    callback = callback || function(){};

    setUpMidi(config.midi);
    setUpDmx(config.dmx);
    setUpOsc(config.osc);

    callback();
}


function doMapping (value, maxValue, mappings){
    var error = [];

    for(var i = 0; i < mappings.length; i++){
        var mapping = mappings[i];

        switch (mapping.type){

            case 'dmx':
                useDmx(value, maxValue, mapping);
                break;

            case 'midi':
                useMidi(value, maxValue, mapping);
                break;

            case 'osc':
                useOsc(value, maxValue, mapping);
                break;

            default :
                error.push('Can not map to: '+ mapping.type);
        }

    }

    return {error: error}
}

function setUpDmx(config){
// TODO: there could be multiple DMX devices of same type connected
    var DMX = require('dmx');
    dmx = new DMX();

    for (var dmxName in config){
        var universe = dmx.addUniverse(dmxName, config[dmxName], 0);
        process.on('beforeExit', function(code){
            //TODO: is this working?
            universe.close();
        });
    }
}

function useDmx (value, maxValue, mapping){
    value = parseInt(value);
    var mappedValue = mapValue(value, maxValue, mapping);

    // TODO: step over many universes in array
    // TODO: step over many channels in array

    if(mapping.fine){
        var mappedValueCh1 = parseInt(mappedValue / 255);
        var mappedValueCh2 = parseInt(mappedValue % 255);

        sendDmx({
            channel: mapping.channel,
            value: mappedValueCh1,
            universe: mapping.name
        });
        sendDmx({
            channel: mapping.channel+1,
            value: mappedValueCh2,
            universe: mapping.name
        });
    }else{

        sendDmx({
            channel: mapping.channel,
            value: mappedValue,
            universe: mapping.name
        });
    }
}

function sendDmx (dmxObj){
    //console.log('DMX: channel: ' + dmxObj.channel + ' value: '+ dmxObj.value);
    if (!dmx){ return }
    var sendObj = {};
    sendObj[parseInt(dmxObj.channel)-1] = dmxObj.value;
    for(var universeName in dmx.universes){
        if( (dmxObj.universe === universeName) || (typeof dmxObj.universe !== 'string')){
            dmx.update(universeName, sendObj);
        }
    }
}

function setUpMidi(config){
    var midiModule = require('midi');
    printMidiList();
    midi = {};
    for(var midiName in config){
        var midiOut = new midiModule.output();
        var portCount = midiOut.getPortCount();
        for (var i = 0; i < portCount; i++) {
            if(midiOut.getPortName(i) === config[midiName]){
                midiOut.openPort(i);
                process.on('beforeExit', function(code){
                    midiOut.closePort(i);
                });
                midi[midiName] = midiOut;
            }
        }
    }

    function printMidiList() {
        console.log('MIDI Port List:');
        var midiOut = new midiModule.output();
        var portCount = midiOut.getPortCount();
        for (var i = 0; i < portCount; i++) {
            console.log(midiOut.getPortName(i));
        }
    }
}

function useMidi (value, maxValue, mappingData){
    value = parseInt(value);
    var type = mappingData.msgType;
    var channel = mappingData.channel;
    var mappedValue1 = mapValue(value, maxValue, mappingData.byte_1);
    var mappedValue2 = mapValue(value, maxValue, mappingData.byte_2);

    // TODO: step over many midiOuts in array
    // TODO: step over many channels in array

    sendMidi({
        type: type,
        channel: channel,
        value1: mappedValue1,
        value2: mappedValue2,
        midiOut: mappingData.name
    });
}

function sendMidi (midiObj){
    //console.log('MIDI: ' + midiObj.type + ' channel: ' + midiObj.channel + ' value: ' + midiObj.value1 + ' - ' + midiObj.value2);
    if (!midi){ return }

    var firstBytePart = '0000';
    switch (midiObj.type){
        case 'note off':
            firstBytePart = '1000';
            break;
        case 'poly key':
            firstBytePart = '1010';
            break;
        case 'controller change':
            firstBytePart = '1011';
            break;
        case 'program change':
            firstBytePart = '1100';
            break;
        case 'channel pressure':
            firstBytePart = '1101';
            break;
        case 'pitch bend':
            firstBytePart = '1110';
            break;
        case 'note on':
        default:
            firstBytePart = '1001';
            break;
    }

    var channel = (midiObj.channel-1).toString(2);
    while (channel.length < 4){
        channel = '0'+channel;
    }
    firstBytePart = firstBytePart + channel;
    firstBytePart = parseInt(firstBytePart, 2);

    for(var midiOut in midi){
        if((midiOut === midiObj.midiOut) || (typeof midiObj.midiOut !== 'string')){
            midi[midiOut].sendMessage([firstBytePart, midiObj.value1, midiObj.value2]);
        }
    }
}

function setUpOsc(config){
    var oscModule = require('node-osc');
    osc = {};

    for (var oscName in config){
        var host = config[oscName].host;
        var port = parseInt(config[oscName].port);

        if(host && port && !isNaN(port)){
            osc[oscName] = new oscModule.Client(host, port);
        }
    }
}

function useOsc (value, maxValue, mapping){

    //console.log(value, maxValue);
    var mappedValue = mapValue(value, maxValue, mapping);
    if(typeof mappedValue === 'undefined'){ return console.log('Mapping went wrong on OSC value: '.red, mappedValue, value, maxValue) }

    // TODO: step over many oscOuts in array
    // TODO: step over many addresses in array

    sendOsc({
        'value': mappedValue,
        'address': mapping.channel,
        'oscOut': mapping.name
    });
}

function sendOsc (oscObj){
    for(var oscOut in osc){
        if((oscOut === oscObj.oscOut) || (typeof oscObj.oscOut !== 'string')){
            osc[oscOut].send(oscObj.address, oscObj.value);
        }
    }
}

// General mapping helper functions
function mapValue(value, maxValue, mapping){
    var mappedValue,
        mapData,
        mapMax;

    if(mapping.doMapping !== false){
        // get foreign value and map that
        if (mapping.foreignValue){
            var foreignModule = controlModule.getModuleById(mapping.foreignValue);
            var foreignValue = foreignModule && foreignModule.value;
            var foreignMax = foreignModule && foreignModule.maxValue;

            mapData = typeof foreignValue === 'number' ? foreignValue : value;
            mapMax = typeof foreignMax === 'number' ? foreignMax : maxValue;

        }else{
            mapData = value;
            mapMax = maxValue;
        }

        var minVal = typeof mapping.minValue === 'number' ? mapping.minValue : mapping.value;
        var maxVal = typeof mapping.maxValue === 'number' ? mapping.maxValue : mapping.value;

        if(typeof minVal === 'number' && typeof maxVal === 'number'){
            mappedValue = getMappedValue(mapData, mapMax, minVal, maxVal, mapping.invert);
        }

    }else{
        mappedValue = mapping.value;
    }
    return mappedValue;
}

// takes the actual and the maximum value of the module
// to return the actual value of the mapped min and max
function getMappedValue (modVal, modMax, mapMin, mapMax, invert){

    var modPercent = modVal / modMax;
    if (invert){ modPercent = 1 - modPercent }

    var mapDelta = mapMax - mapMin;
    var mapValue = mapMin + (mapDelta * modPercent);

    return parseInt(mapValue);
}

function doStartupMapping(callback){
    console.log('Doing startup mapping...'.cyan);
    callback = callback || function(){};

    var startupConfigPath = global.tkvrBasePath + '/resources/config/startup-mapping.json';
    var filesystem = require('fs');
    filesystem.readFile(startupConfigPath, onFileRead);

    function onFileRead (error, buffer){
        if(error) return console.log(error.toString().yellow);
        var jsonConfig = buffer.toString();
        var mappingLog = stepConfig(JSON.parse(jsonConfig));
        callback(mappingLog);
    }

    function stepConfig(config){
        if (!config.startupMapping) return console.log('No startup mapping used.'.yellow);
        return doMapping(1, 1, config.startupMapping);
    }
}

var that = {};
that.init = init;
that.doMapping = doMapping;
that.doStartupMapping = doStartupMapping;
module.exports = that;

// nice logging
require('colors');