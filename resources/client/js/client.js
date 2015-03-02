// This file contains just everything and should TODO split up to many files
// (but it works)

/**
 * WEBSOCKETS
 *
 * requires socket.io
 */
var startSockets = function(){

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


    viewBuilder.init(function(){
        socket.emit('get_view_list');
    });

    socket.on('view_list', function(list){
        list = JSON.parse(list);
        console.log('Viewlist:',list);

        for(var view in list) {
            // TODO: make list in html and emit get_view on selection
            socket.emit('get_view', view);
        }
    });

    socket.on('view_config', function(view) {
        view = JSON.parse(view);
        console.log('View ' + view.id + ':', view);
        viewBuilder.create(view);
    });
};
startSockets();