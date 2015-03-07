// this module is a factory for control modules
// depending on the type defined in the config
// it will create and return a control module object
// this will be the only control module needed to require

// save the socket.io reference and share it with control modules created
var io = undefined;

// save the dmx reference and share it with control modules created
// TODO: there could be multiple DMX devices connected
var DMX = require('dmx');
var dmx = new DMX();
//var enttecOpenDriver = require('./dmx-drivers/enttec-open-usb-dmx.js');
//dmx.registerDriver('enttec-open-usb-dmx', enttecOpenDriver);
// TODO: at the moment always the enttec open is selected
var universe = dmx.addUniverse('takeover', 'enttec-open-usb-dmx', 0);

// all available modules should be listed here
var controlModules = {};
    controlModules['_abstract'] = require('./control-modules/_abstract-module.js');
    controlModules['button'] = require('./control-modules/button.js');
    controlModules['slider'] = require('./control-modules/slider.js');
    controlModules['xy-pad'] = require('./control-modules/xy-pad.js');

var createdModules = {};

//TODO: use promises?
function init (callback){
    callback = callback || function(){};

    createFromFiles(function(){
        doStartupMapping();
        console.log('Finished creating control-modules.'.cyan);
        callback();
    });
}

function createModule (config){

    // FIXME: has io really to be set when creating stuff?
    if (!io){ return console.log( 'control-module-factory '.grey + 'No io set, do that first!'.red )}
    if (!config || !config.type || controlModules[config.type] === undefined){ return console.log( 'control-module-factory '.grey + ('No such control-type: ' + config.type).red )}

    // set io in config
    config.io = config.io || io;
    config.dmx = config.dmx || dmx;
    config.universe = config.universe || universe;

    var shared = {
        'getModuleById': getModuleById
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
    console.log( 'control-module-factory '.grey + ('created: '.green + module.getName() + ' '+ module.getType()+ ' ' + module.getId().toString().grey));

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

    function doMapping(mapping){
        switch (mapping.type.toLowerCase()){
            case 'dmx':
                if (!mapping.channel || typeof mapping.value === 'undefined') return console.log('Bad startup mapping: missing information.'.yellow);
                var sendObj = {};
                sendObj[parseInt(mapping.channel)-1] = mapping.value;
                universe.update(sendObj);
                break;

            case 'midi':
                break;

            case 'osc':
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