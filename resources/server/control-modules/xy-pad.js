// TODO: animations for x and y axis

// config.
// isParent
// isChild
// parentObj
// sharedEventHandler
//

var xyPad = function(config, prtktd){

    prtktd = prtktd || {};

    config.isParent = true;
    var module = require('./_abstract-module.js');
    var pblc = module(config, prtktd);

    // X AXIS
    var xConfig = getAxisConfig('x', config);
    var xAxis = prtktd.addChild('x', xConfig);

    // Y AXIS
    var yConfig = getAxisConfig('y', config);
    var yAxis = prtktd.addChild('y', yConfig);


    function getAxisConfig(axisName, baseConfig){

        var config = global.tkvrClone(baseConfig);
        config.isParent = false;
        config.isChild = true;
        config.parentObj = prtktd;
        config.type = 'slider';
        config.mapping = config[axisName + 'Mapping'];
        config.id = config.id + '-'+axisName.toUpperCase();
        config.name = config.name + ' '+axisName+'-axis';

        return config;
    }

    return pblc;
};

module.exports = xyPad;


// nice logging
require('colors');