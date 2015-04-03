var extend = require('util')._extend;

global.tkvrClone = clone;

function clone(obj){
    return extend({}, obj);
}