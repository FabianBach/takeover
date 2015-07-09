// Just some global util functions.
// No good style, but easy and fast.
// TODO: get rid of this...

var extend = require('util')._extend;

function clone(obj){
    return extend({}, obj);
}

global.tkvrClone = clone;