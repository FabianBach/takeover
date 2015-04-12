
function getConfigsFromPath(configsPath, callback) {

    if (typeof(configsPath) === 'function') {
        callback = configsPath
    }
    if (typeof(configsPath) !== 'string') {
        configsPath = './resources/config/control-modules/';
    }
    if (configsPath[configsPath.length - 1] !== '/') {
        configsPath += '/'
    }

    callback = callback || function () {};

    var filesystem = require('fs'),
        path = require('path'),
        pathsFound = [],
        filesRead = [];

    // get all json from config path
    filesystem.readdir(configsPath, function (error, fileArray) {
        if (error) {
            return console.log(error)
        }
        var filteredArray = [];

        for (var i = 0; i < fileArray.length; i++) {
            var item = fileArray[i];
            if (path.extname(item) === '.json') {
                filteredArray.push(configsPath + item);
            }
        }
        readJson(filteredArray);
    });

    //read each json
    function readJson(pathArray) {
        pathsFound = pathArray;
        for (var i = 0; i < pathArray.length; i++) {
            console.log(pathArray[i].cyan);
            filesystem.readFile(pathArray[i], onFileRead);
        }
    }

    // create from each json
    function onFileRead(error, buffer) {
        if (error) return console.log(error);

        var jsonConfig = buffer.toString();
        var config = JSON.parse(jsonConfig);
        filesRead.push(config);

        if (filesRead.length === pathsFound.length) {
            callback(filesRead);
        }
    }
}

var that = {};
that.getConfigsFromPath = getConfigsFromPath;
module.exports = that;