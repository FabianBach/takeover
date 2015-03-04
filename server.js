

//TODO: read a config file and set up server by that file

// standard port if no port comes in arguments
var port = 8080;

// check if port is provided in arguments
if(process.argv.length > 2){
    port = Number(process.argv[2]);
}


var express = require('express'),
    io = require('socket.io'),
    http = require('http'),

    //TODO: config that controlModule
    controlModules = require('./resources/server/control-module.js'),
    viewModules = require('./resources/server/view-module.js'),

    server,

    takeover = {};

function init(){

    takeover = express();
    takeover.use(express.static(__dirname + '/public'));

    takeover.get('/tkvr-view-list', function(req, res){
        var list = viewModules.getViews();
        res.json(list);
    });

    takeover.get('/tkvr-view/:id', function(req, res){
        var view = viewModules.getViewById(req.params.id);
        res.json(view);
    });

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
    controlModules.init(function(){
        viewModules.init();
    });


}

function openWebSockets(){

    io.sockets.on('connection', function(socket){
        console.log('Yeay, client connected!'.rainbow);

        setSocketListeners(socket);
    });
}

function setSocketListeners(socket){

    socket.on('disconnect', function(data){
        console.log('Oh, client disconnected...');
    });

    socket.on('get_module_list', function(data){
        var list = controlModules.getModuleList();
        socket.emit('module_list', JSON.stringify(list));
    });

    socket.on('get_view_list', function(data){
        var list = viewModules.getViews();
        socket.emit('view_list', JSON.stringify(list));
    });

    socket.on('get_view', function(viewId){
        var view = viewModules.getViewById(viewId);
        socket.emit('view_config', JSON.stringify(view));
    })
}

// beautiful loggin
require('colors');