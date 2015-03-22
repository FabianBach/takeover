// this module is a factory for control modules
// depending on the type defined in the config
// it will create and return a control module object
// this will be the only control module needed to require

var io,
    dmx,
    midi,
    osc;

// all available modules should be listed here
var controlModules = {};
    controlModules['_abstract'] = require('./control-modules/_abstract-module.js');
    controlModules['button'] = require('./control-modules/button.js');
    controlModules['slider'] = require('./control-modules/slider.js');
    controlModules['xy-pad'] = require('./control-modules/xy-pad.js');

var createdModules = {};

function init (config, callback){
    callback = callback || function(){};

    setUpMidi(config.midi);
    setUpDmx(config.dmx);
    setUpOsc(config.osc);

    createFromFiles(function(){
        doStartupMapping();
        //TODO: give back error if something goes wrong
        callback();
    });
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
                    midiOut.closePort();
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

function setUpOsc(config){
    //TODO: setUpOsc
}

function createModule (config){

    if (!io){ return console.log( 'control-module-factory '.grey + 'No io set, do that first!'.red )}
    if (!config || !config.type || controlModules[config.type] === undefined){ return console.log( 'control-module-factory '.grey + ('No such control-type: ' + config.type).red )}

    // set io in config
    config.io = config.io || io;
    config.dmx = config.dmx || dmx;
    config.midi = config.midi|| midi;

    var shared = {
        'getModuleById': getModuleById,
        'createModule' : createModule
    };

    // create the module
    var module = controlModules[config.type](config, shared);

    // check if module was returned or if something went wrong when creating
    if (module.error){
        console.log( 'control-module-factory '.grey + ('something went wrong when creating a ' + config.type).red );
        console.log( 'control-module-factory '.grey + (module.toString()).red );
        throw new Error(module.error.toString());
    }

    // save the reference to every created module in static array
    createdModules[module.getId()] = module;
    console.log( 'control-module-factory '.grey + ('created: '.green + module.getName() + ' '+ module.getType()+ ' ' + module.getId().grey));

    return module;
}

//TODO: use promises?
function createFromFiles(configsPath, callback){

    if (typeof(configsPath) === 'function'){ callback = configsPath }
    if (typeof(configsPath) !== 'string'){configsPath = './resources/config/control-modules/';}
    if (configsPath[configsPath.length-1] !== '/'){ configsPath += '/'}

    callback = callback || function(){};

    var configsModule = require('./config-module.js');
    configsModule.getConfigsFromPath(configsPath, function(configs){
        for (var i = 0; i < configs.length; i++){
            var config = configs[i];
            if (!config.disabled){
                createModule(config);
            }
        }
        callback();
    });
}

function getModuleList(){
    var list = [];
    for (var moduleId in createdModules){
        list.push(getModuleById(moduleId));
    }
    return list;
}

function getModuleById(moduleId){

    var moduleObj = createdModules[moduleId];
    if(!moduleObj) return null;
    return({
        id: moduleObj.getId(),
        name: moduleObj.getName(),
        namespace: moduleObj.getNamespace(),
        type: moduleObj.getType(),
        title: moduleObj.getTitle(),
        value: moduleObj.getValue(),
        minValue: moduleObj.getMinValue(),
        maxValue: moduleObj.getMaxValue()
    })
}

function doStartupMapping(startupConfig){

    console.log('Doing startup mapping...'.cyan);

    if(startupConfig){
        stepConfig(startupConfig);
    }else{
        var startupConfigPath = './resources/config/startup-mapping.json';
        var filesystem = require('fs');
        filesystem.readFile(startupConfigPath, onFileRead);
    }

    function onFileRead (error, buffer){
        if(error) return console.log(error.toString().yellow);
        var jsonConfig = buffer.toString();
        stepConfig(JSON.parse(jsonConfig));
    }

    function stepConfig(config){
        if (!config.startupMapping) return console.log('No startup mapping used.'.yellow);
        for(var i = 0; i < config.startupMapping.length; i++){
            doMapping(config.startupMapping[i]);
        }
    }

    //TODO: totally re-use the mapping built in abstract
    // somehow put that mapping in extra module
    function doMapping(mapping){
        switch (mapping.type.toLowerCase()){
            case 'dmx':
                if (!mapping.channel || typeof mapping.value === 'undefined') return console.log('Bad startup mapping: missing information.'.yellow);
                var sendObj = {};
                sendObj[parseInt(mapping.channel)-1] = mapping.value;

                for(var universeName in dmx.universes){
                    if( (mapping.universe === universeName) || (typeof mapping.universe !== 'string')){
                        dmx.update(universeName, sendObj);
                    }
                }
                break;

            case 'midi':
                //this is a TODO, but should be solved by reusing the mapping
                break;

            case 'osc':
                //this is a TODO, but should be solved by reusing the mapping
                break;
        }
    }
}

function setIo (_io){
    io = _io;
}

var that = {};
that.init = init;
that.createModule = createModule;
that.createFromFiles = createFromFiles;
that.getModuleList = getModuleList;
that.getModuleById = getModuleById;
that.doStartupMapping = doStartupMapping;
that.setIo = setIo;

module.exports = that;

// beautiful loggin
require('colors');
