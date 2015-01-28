// this module is a factory for control modules
// depending on the type defined in the config
// it will create and return a control module object
// this will be the only control module needed to require

// TODO: maybe this object should hold things like the socket instance and MIDI and stuff

require('colors');

// all available modules should be listed here
var controlModules = {};
    controlModules['_abstract'] = require('./control-modules/_abstract-module.js');
    controlModules['simple button'] = require('./control-modules/button-simple.js');

var createdModules = {};

var controlModuleFactory = function(config){

    if (!config.type || controlModules[config.type] === undefined){ return console.log( 'control-module-factory '.grey + ('No such control-type: ' + config.type).red) }

    var module = controlModules[config.type];
        module = module(config);

    if (module.error){
        console.log( 'control-module-factory '.grey + ('something went wrong when creating a ' + config.type).red );
        console.log( 'control-module-factory '.grey + (module.toString()).red );
        throw module.error;
        //return module;
    }

    createdModules[module.getModuleId] = module;

    console.log( 'control-module-factory '.grey + ('created: '.green + module.getModuleName() + ' ' + module.getModuleId().toString().grey));

    return module;
};

module.exports = controlModuleFactory;