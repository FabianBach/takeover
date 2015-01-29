// this module is a factory for control modules
// depending on the type defined in the config
// it will create and return a control module object
// this will be the only control module needed to require

// TODO: maybe this object should hold things like the socket instance and MIDI and stuff

require('colors');

var that = {};

// all available modules should be listed here
var controlModules = {};
    controlModules['_abstract'] = require('./control-modules/_abstract-module.js');
    controlModules['simple button'] = require('./control-modules/button-simple.js');

var createdModules = {};

function controlModuleFactory (config){

    if (!config.type || controlModules[config.type] === undefined){ return console.log( 'control-module-factory '.grey + ('No such control-type: ' + config.type).red) }

    // create the module
    var module = controlModules[config.type](config);

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

function getModuleList(){
    var list = [];
    for (id in createdModules){
        var moduleObj = createdModules[id];
        list.push({
            id: moduleObj.getId(),
            name: moduleObj.getName(),
            type: moduleObj.getType()
        })
    }
    return list;
}

that.createModule = controlModuleFactory;
that.getModuleList = getModuleList;

module.exports = that;
