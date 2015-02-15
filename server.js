
// standard port if no port comes in arguments
var port = 8080;

// check if port is provided in arguments
if(process.argv.length > 2){
    port = Number(process.argv[2]);
}


var express = require('express'),
    io = require('socket.io'),
    http = require('http'),

    controlModules = require('./resources/server_modules/control-module.js'),

    server,

    takeover = {};

function init(){

    takeover = express();
    takeover.use(express.static(__dirname + '/public'));

    server = takeover.listen(port, onServerReady);

    io = io.listen(server);

}
init();

function onServerReady(){

    var host = server.address().address;
    var port = server.address().port;

    console.log('Server listening at http://%s:%s', host, port.toString().cyan);

    openWebSockets();

    controlModules.setIo(io);
    controlModules.init();
}

function openWebSockets(){

    io.sockets.on('connection', function(socket){
        console.log('Yeay, client connected!');

        setSocketListeners(socket);
    });
}

function setSocketListeners(socket){

    socket.on('disconnect', function(){
        console.log('Oh, client disconnected...');
    });

    socket.on('get_module_list', function(){
        var list = controlModules.getModuleList();
        socket.emit('module_list', JSON.stringify(list));
    })
}

// beautiful loggin
require('colors');