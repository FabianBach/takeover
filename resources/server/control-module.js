// this module is a factory for control modules
// depending on the type defined in the config
// it will create and return a control module object
// this will be the only control module needed to require

var io;

// all available modules should be listed here
var controlModules = {};
    controlModules['_abstract'] = require('./control-modules/_abstract-module.js');
    controlModules['button'] = require('./control-modules/button.js');
    controlModules['slider'] = require('./control-modules/slider.js');
    controlModules['xy-pad'] = require('./control-modules/xy-pad.js');

var createdModules = {};

function init (config, callback){
    callback = callback || function(){};

    createFromFiles(function(){
        setForeignListeners();
        //TODO: give back error if something goes wrong
        callback();
    });
}

function createModule (config){

    if (!io){ return console.log( 'control-module-factory '.grey + 'No io set, do that first!'.red )}
    if (!config || !config.type || controlModules[config.type] === undefined){ return console.log( 'control-module-factory '.grey + ('No such control-type: ' + config.type).red )}

    config.io = config.io || io;

    // the shared object is a substitute for protected members in JS
    var shared = {
        'setForeignListener': setForeignListener,
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

// will call the set foreign value listeners function on each created module
// has to be done when all modules have been created
// TODO: at the moment the modules get linked together
// maybe it would be better to make the control module listen for value changes
// and let other modules register for changes on other module IDs
function setForeignListeners(){
    for(var module in createdModules){
        createdModules[module].setForeignValueListeners();
    }
}

function setForeignListener(moduleId, listener){
    var module = createdModules[moduleId];
    if(!module){ return };
    module.onValueChange(listener);
    console.log('Foreign value listener on:', moduleId.grey);
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

var that = {};
that.init = init;
that.createModule = createModule;
that.createFromFiles = createFromFiles;
that.getModuleList = getModuleList;
that.getModuleById = getModuleById;
that.setIo = setIo;

module.exports = that;

// beautiful loggin
require('colors');
