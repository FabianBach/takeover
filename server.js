

var express = require('express'),
    socket = require('socket.io');



var takeover = express();

takeover.get('/', function (req, res) {
    res.send('Hallo Jana! Mau! :)!')
});

var server = takeover.listen(3000, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port)

});