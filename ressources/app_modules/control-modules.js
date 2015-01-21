//TODO: this is a node module at the moment
//      thats okay, but it should probably just return a constructor for a takeover module


// just to lazy to append everything to exports
module.exports = this;



/* PUBLIC */

this.init = function(config){
    setId();
    applyConfig(config);

};

this.getId = function(){
    return id;
};



/* PRIVATE */

var id = null,
    type = null,
    mapping = null,

    //view params
    position = {x : 0, y : 0},
    size = {x : 0, y : 0};


function setId(){
    id = Math.random() * new Date().getTime() * 100000;
};

function applyConfig(config, cb){
    var callback = cb || function(){};

    //type
    if(!'type' in config) return callback('No type in config', false);
    type = config.type;

    //mapping
    if(!'mapping' in config) return callback('No mapping in config', false);
    mapping = config.mapping;

};