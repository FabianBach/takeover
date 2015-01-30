// Testing the abstract control module
// just fuzzing around with config and stuff

var controlModules = require('./resources/server_modules/control-module.js'),
    io,
    modules = [];

var init = function(){

    try{
        modules[modules.length] = controlModules.createModule({

            io: io,

            type: '_abstract',
            name: 'Abstract'

        });
    }catch(error){
        console.log(error);
    }

    try{
        modules[modules.length] = controlModules.createModule({

            io: io,

            type: 'simple button',
            name: 'Testbutton'

        });
    }catch(error){
        console.log(error);
    }

    console.log(controlModules.getModuleList());

};

var setIo = function(_io){
    io = _io;
    init();
};
module.exports.setIo = setIo;





// Testing event handler
// everything is working just perfectly fine
//var eventHandler = require('./resources/server_modules/event-part.js');
//eventHandler = eventHandler();
//
//var obj = {hell : 'yeah!'};
//
//eventHandler.on('yep', function(data){
//    console.log('yep'.cyan, this.hell, data);
//}, obj);
//
//eventHandler.fire('yep', {nice: 'stuff'}, 'no problem');






/*
// checkin out colors
// the code below works fine
require('colors');
var string = 'console is such a nice thing, but how does color work?';

console.log(string);

string = string.red;

console.log(string);

string += '... okay, got it!'.yellow;

console.log(string);*/






// Checking if requiring socket.io gives back same object as in server.js
// Result: nope, gives back a new instace
// So we have to give that reference to where it is to be used
/*
var io = require('socket.io');
console.log(io);

var logSocketio = function(){
    console.log(io);
};

//var looping = setInterval(logSocketio, 1000);

module.exports.setIo = function(_io){
    io = _io;
    console.log(io);
};*/



require('colors');
