var port = 8080;

if(process.argv.length > 2){
    port = Number(process.argv[2]);
}

var express = require('express'),
    io = require('socket.io'),
    http = require('http');

var takeover = express();

takeover.use(express.static(__dirname + '/public'));

var server = takeover.listen(port, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Server listening at http://%s:%s', host, port)

});

io = io.listen(server);

io.sockets.on('connection', function(socket){

    console.log('Yeay, client connected!');

    socket.on('disconnect', function(){
        console.log('Oh, client disconnected...');
    });

    socket.on('value_change', function(data){
        console.log('Value changed: ', data);
    });
});