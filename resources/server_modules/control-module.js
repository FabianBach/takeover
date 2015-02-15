// this module is a factory for control modules
// depending on the type defined in the config
// it will create and return a control module object
// this will be the only control module needed to require

var that = {};

// save the socket.io reference and share it with control modules created
var io = undefined;

// save the dmx reference and share it with control modules created
// TODO: there could be multiple DMX devices connected
var DMX = require('dmx');
var dmx = new DMX();
//var enttecOpenDriver = require('./dmx-drivers/enttec-open-usb-dmx.js');
//dmx.registerDriver('enttec-open-usb-dmx', enttecOpenDriver);
var universe = dmx.addUniverse('takeover', 'enttec-open-usb-dmx', 0);

// all available modules should be listed here
var controlModules = {};
    controlModules['_abstract'] = require('./control-modules/_abstract-module.js');
    controlModules['button'] = require('./control-modules/button.js');
    controlModules['slider'] = require('./control-modules/slider.js');
    controlModules['xy-pad'] = require('./control-modules/xy-pad.js');

var createdModules = {};

function createModule (config){

    if (!io){ return console.log( 'control-module-factory '.grey + 'No io set!'.red )}
    if (!config.type || controlModules[config.type] === undefined){ return console.log( 'control-module-factory '.grey + ('No such control-type: ' + config.type).red )}

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

function createFromFiles(configsPath){

    configsPath = configsPath || './resources/config/control-modules/';

    if(configsPath[configsPath.length-1] !== '/'){ configsPath += '/'}

    var filesystem = require('fs'),
        path = require('path');

    // get all json from config path
    filesystem.readdir( configsPath, function(error, fileArray){
        if (error){ return console.log(error)}
        var filteredArray = [];

        for (var i = 0; i < fileArray.length; i++) {
            var item = fileArray[i];
            if (path.extname(item) === '.json') {
                filteredArray.push(configsPath + item);
            }
        }
        readJson(filteredArray);
    });

    //read each json
    function readJson(pathArray){
        for(var i = 0; i < pathArray.length; i++){
            console.log(pathArray[i].cyan);
            filesystem.readFile(pathArray[i], onFileRead);
        }
    }

    // create from each json
    function onFileRead (error, buffer){
        if(error) return console.log(error);

        var jsonConfig = buffer.toString();
        var config = JSON.parse(jsonConfig);

        createModule(config);
    }

    // TODO: maybe even watch that folder...
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

function setIo (_io){
    io = _io;
}

that.createModule = createModule;
that.createFromFiles = createFromFiles;
that.getModuleList = getModuleList;
that.getModuleById = getModuleById;
that.setIo = setIo;

module.exports = that;

// beautiful loggin
require('colors');
