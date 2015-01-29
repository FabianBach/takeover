
// standard port if no port comes in arguments
var port = 8080;

// check if port is provided in arguments
if(process.argv.length > 2){
    port = Number(process.argv[2]);
}


var express = require('express'),
    io = require('socket.io'),
    http = require('http');

var experiments = require('./_experiments.js');

var takeover = express();

takeover.use(express.static(__dirname + '/public'));

var server = takeover.listen(port, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Server listening at http://%s:%s', host, port)

});

io = io.listen(server);
experiments.setIo(io);

io.sockets.on('connection', function(socket){

    console.log('Yeay, client connected!');

    socket.on('disconnect', function(){
        console.log('Oh, client disconnected...');
    });

    socket.on('get_module_list', function(){
        // TODO: send the modules (get em via control-module.getModuleList)
    })

});

// TODO: require(control-module.js)
// TODO: somehow set the io in control-module.js
// TODO: get control module configs via filereader
// TODO: build each config to module