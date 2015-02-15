// This file contains just everything and should TODO split up to many files
// (but it works)

/**
 * WEBSOCKETS
 */
var startSockets = function(){

    //var socket = io.connect('/');
    var socket = io.connect(window.location.toString());

    socket.on('connecting', function(){
        console.log('Connecting...');
    });

    socket.on('connect', function(){
        console.log('Connection to server established!');
    });

    socket.on('disconnect', function(){
        console.log('Disconnected.');
        //TODO: disable all inputs?
    });


    socket.on('reconnecting', function(){
        console.log('Reconnecting...');
    });
    socket.on('reconnect', function(){
        console.log('Reconnected.');
    });


    socket.on('connect_failed', function(){
        console.log('Connection failed!');
    });
    socket.on('error', function(){
        console.log('Error!');
    });


    moduleBuilder.init(function(){
        socket.emit('get_module_list');
    });

    socket.on('module_list', function(list){

        list = JSON.parse(list);
        $.each(list, function(key, value){
            moduleBuilder.create(value);
        });

    });
};

$(document).ready(function(){
    startSockets();
});
