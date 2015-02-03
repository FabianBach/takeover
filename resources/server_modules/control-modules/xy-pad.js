
var xyPad = function(config, shared){

    shared = shared || {};

    // this object inherits from the abstract object
    var abstract = require('./_abstract-module.js');
    var id = config._id || parseInt(Math.random() * new Date().getTime() * 10000000).toString(36).toUpperCase();

    // build x-axis
    config.mapping = config.xMapping;
    config._id = id + '-X';
    var xAxis = abstract(config, shared);

    //build y-axis
    config.mapping = config.yMapping;
    config._id = id + '-Y';
    var yAxis = abstract(config, shared);

    // DECLARE OVERRIDES
    // save the references before we override them
    var getXId = xAxis.getId;
    var getYId = yAxis.getId;
    function getId(){
        return id;
    }

    var getXValue = xAxis.getValue;
    var getYValue = yAxis.getValue;
    function getValue(){
        return{
            x: getXValue(),
            y: getYValue()
        }
    }

    var getXNamespace = xAxis.getNamespace;
    var getYNamespace = yAxis.getNamespace;
    function getNamespace(){
        return{
            x: getXNamespace(),
            y: getYNamespace()
        }
    }

    // return one of them, will make no difference
    var that = xAxis;

    // OVERRIDE
    that.getId = getId;
    that.getValue = getValue;
    that.getNamespace = getNamespace;

    return that;
};

module.exports = xyPad;

/*
 * ** STATIC STUFF **
 */

//function validateConfig(config) {
//
//    var error = [];

// validate

//return {error: error};
//}

// nice logging
require('colors');