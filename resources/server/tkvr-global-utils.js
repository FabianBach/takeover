var extend = require('util')._extend;

function clone(obj){
    return extend({}, obj);
}

global.tkvrClone = clone;