//TODO:
// This should be the entering point for the app
// it should set up all the stuff
// at the moment there is quiet a mess in server.js

var server = require('./resources/server/server.js');
var controlModules = require('./resources/server/control-module.js');
var viewModules = require('./resources/server/view-module.js');


var tkvrConfigPath = './resources/config/main-config.json';
var filesystem = require('fs');
var config = {};
filesystem.readFile(tkvrConfigPath, onFileRead);

function onFileRead (error, buffer){
    if(error) return console.log(error.toString().yellow);
    var jsonConfig = buffer.toString();

    config = JSON.parse(jsonConfig);
    initServer(config, onServerInit);
}

function initServer(config, callback){
    server.init(config.server, callback);
}
function onServerInit(io){
    initControls(io, onControlsInit);
}

function initControls(io, callback){
    controlModules.setIo(io);
    controlModules.init(config, callback);
}
function onControlsInit(error){
    console.log('Finished creating control-modules.'.cyan);
    initViews(onViewsInit);
}


function initViews(callback){
    viewModules.init(config, callback);
}
function onViewsInit(error){
    console.log('Finished creating views.'.cyan);
}

// beautiful loggin
require('colors');