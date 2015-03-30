// TODO: animations for x and y axis

var xyPad = function(config, shared){

    shared = shared || {};

    // this object inherits from the abstract object
    var abstract = require('./_abstract-module.js');
    var id = config.id || parseInt(Math.random() * new Date().getTime() * 10000000).toString(36).toUpperCase();
    var name = config.name;
    var type = config.type;

    // build x-axis
    config.type = 'slider';
    config.mapping = config.xMapping;
    config.id = id + '-X';
    config.name = name + ' x-axis';
    //var xAxis = abstract(config, shared);
    var xAxis = shared.createModule(config);

    //build y-axis
    config.type = 'slider';
    config.mapping = config.yMapping;
    config.id = id + '-Y';
    config.name = name + ' y-axis';
    //var yAxis = abstract(config, shared);
    var yAxis = shared.createModule(config);

    //FIXME: have to reset config back to normal...
    //config.type = type;
    //config.id = id;
    //config.name = name;

    // DECLARE OVERRIDES
    // save the references before we override them
    var getXId = xAxis.getId;
    var getYId = yAxis.getId;
    function getId(){
        return id;
    }

    var getXName = xAxis.getName;
    var getYName = yAxis.getName;
    function getName(){
        return name;
    }

    var getXType = xAxis.getType;
    var getYType = yAxis.getType;
    function getType(){
        return type;
    }

    var getXValue = xAxis.getValue;
    var getYValue = yAxis.getValue;
    function getValue(){
        return{
            x: getXValue(),
            y: getYValue()
        }
    }

    var getXMinValue = xAxis.getMinValue;
    var getYMinValue = yAxis.getMinValue;
    function getMinValue(){
        return{
            x: getXMinValue(),
            y: getYMinValue()
        }
    }

    var getXMaxValue = xAxis.getMaxValue;
    var getYMaxValue = yAxis.getMaxValue;
    function getMaxValue(){
        return{
            x: getXMaxValue(),
            y: getYMaxValue()
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
    //var that = xAxis;
    var that = {};

    // FIXME: this is a risky solution
    // real cloning would be better...
    for(var publicMember in xAxis){
        that[publicMember] = xAxis[publicMember];
    }

    // OVERRIDE
    that.getId = getId;
    that.getName = getName;
    that.getType = getType;
    that.getValue = getValue;
    that.getMinValue = getMinValue;
    that.getMaxValue = getMaxValue;
    that.getNamespace = getNamespace;

    return that;
};

module.exports = xyPad;

/*
 * ** STATIC STUFF **
 */

//function validateConfig(config) {
// TODO: check for x and y stuff
//    var error = [];

// validate

//return {error: error};
//}

// nice logging
require('colors');