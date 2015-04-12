// This is the main node file to be executed
// It loads and sets up the server, the sockets, the controls and the views
// It also does the startup-mapping when finished setting up everything

global.tkvrBasePath = __dirname;
require(global.tkvrBasePath + '/resources/server/tkvr-global-utils.js');

var server = require(global.tkvrBasePath + '/resources/server/server.js');
var controlModules = require(global.tkvrBasePath + '/resources/server/control-module.js');
var viewModules = require(global.tkvrBasePath + '/resources/server/view-module.js');
var mapper = require(global.tkvrBasePath + '/resources/server/mapping-module.js');


var tkvrConfigPath = './resources/config/main-config.json';
var filesystem = require('fs');
var config = {};

// first we get the main configuration
filesystem.readFile(tkvrConfigPath, onTkvrConfigRead);
function onTkvrConfigRead (error, buffer){
    if(error) return console.log(error.toString().yellow);
    var jsonConfig = buffer.toString();

    config = JSON.parse(jsonConfig);
    initMapper(config, onMapperInit);
}

// next we first set up the mapper to get the hardware ready
// else we could have controls that are not working (?)
function initMapper(config, callback){
    mapper.init(config, callback);
}
function onMapperInit(){
    mapper.doStartupMapping();
    initServer(config, onServerInit);
}

// then we get the server and sockets ready to go
function initServer(config, callback){
    server.init(config.server, callback);
}
function onServerInit(io){
    initControls(io, onControlsInit);
}

// at last we need the controls and views
function initControls(io, callback){
    controlModules.setIo(io);
    controlModules.init(config, callback);
}
function onControlsInit(error){
    console.log('Finished creating control-modules.'.cyan);
    initViews(onViewsInit);
}
// the views have to be initialised after the controls
function initViews(callback){
    viewModules.init(config, callback);
}
function onViewsInit(error){
    console.log('Finished creating views.'.cyan);
}

// beautiful loggin
require('colors');