// Testing the abstract control module
// just fuzzing around with config and stuff

var controlModule = require('./ressources/server_modules/control-module.js'),
    io,
    modules = [];

var init = function(){

    try{
        modules[modules.length] = controlModule({

            io: io,

            type: '_abstract',
            name: 'weird nonsense',
            position: {
                x: 50,
                y: 0
            },
            size: {
                x: 50,
                y: 50
            }
        });
    }catch(error){
        console.log(error);
    }


    try{
        modules[modules.length] = controlModule({

            io: io,

            type: 'simple button',
            name: 'Testbutton',
            position: {
                x: 0,
                y: 0
            },
            size: {
                x: 50,
                y: 50
            }
        });
    }catch(error){
        console.log(error);
    }




    for(var i = 0; i < modules.length; i++){
        //console.log(modules[i].getModuleName());
    }

};

var setIo = function(_io){
    io = _io;
    init();
};
module.exports.setIo = setIo;






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
