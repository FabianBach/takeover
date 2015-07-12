// config.
// isParent
// isChild
// parentObj
// sharedEventHandler
//

var xyPad = function(config, prtktd){

    prtktd = prtktd || {};

    // is a parent element and will use two slider-child-modules
    config.isParent = true;
    var module = require('./_abstract-module.js'); // new module
    var pblc = module(config, prtktd);

    // X AXIS - create frist child module
    var xConfig = getAxisConfig('x', config);
    var xAxis = prtktd.addChild('x', xConfig);

    // Y AXIS - create second child module
    var yConfig = getAxisConfig('y', config);
    var yAxis = prtktd.addChild('y', yConfig);


    // Just a helper function to create the child-configs
    function getAxisConfig(axisName, baseConfig){

        var config = global.tkvrClone(baseConfig);
        var axis = config[axisName + '-axis'];
        config.isParent = false;
        config.isChild = true;
        config.parentObj = prtktd;
        config.type = 'slider';
        config.mapping = axis.mapping;
        config.animation = axis.animation;
        config.id = config.id + '-'+axisName.toUpperCase();
        config.name = config.name + ' '+axisName+'-axis';

        return config;
    }

    return pblc;
};

module.exports = xyPad;

// nice logging
require('colors');