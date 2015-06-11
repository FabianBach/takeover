// this module is a factory for view modules
// it will read the view configs and will augment the control module json
// this information will be the only information the client needs to render a view beside the templates

var controlModuleFactory = require('./control-module.js');

var createdViews = {};

function init (config, callback){
    callback = callback || function(){};

    createFromFiles(function(){
        callback();
    });
}

function createFromFiles(configsPath, callback){

    if (typeof(configsPath) === 'function'){ callback = configsPath }
    if (typeof(configsPath) !== 'string'){configsPath = './resources/config/control-views/';}
    if (configsPath[configsPath.length-1] !== '/'){ configsPath += '/'}

    callback = callback || function(){};

    var configsModule = require('./config-module.js');
    configsModule.getConfigsFromPath(configsPath, function(configs){
        for (var i = 0; i < configs.length; i++){
            var config = configs[i];
            if (!config.disabled){
                createView(config);
            }
        }
        callback();
    });
}

function createView(config){
    if (!config || !!config.disabled) return;

    var validateLog = validateConfig(config);
    if(validateLog.error.length){return console.log('view-factory'.grey + ' error: '.red + validateLog.error)}

    var newView = config;

    for(var i = 0; i < newView.controls.length; i++){
        var control = newView.controls[i];
        var controlModule = controlModuleFactory.getModuleById(control.id);
        if(!controlModule){
            console.log('view-factory'.grey + ' error: '.red + 'No control module for this id: ' + control.id)
            continue;
        }

        for(var key in controlModule){
            control[key] = controlModule[key];
        }
    }
    createdViews[newView.id] = newView;
    console.log('view-factory'.grey + ' created: '.green + newView.title +' '+ newView.id.grey);
    return newView;
}

function getViews(){
    //TODO: Cache this list
    var list = [];
    for( var view in createdViews){
        var viewItem = createdViews[view];
        var listItem = {
            id: viewItem.id,
            title: viewItem.title
        };
        list.push(listItem);
    }
    return list;
}

function getViewById(id){
    if(!id){ return console.log('view-factory'.grey + ' error: '.red + 'No View with such id: ' + id)}
    return createdViews[id];
}

var that = {};
that.init = init;
that.createFromFiles = createFromFiles;
that.getViews = getViews;
that.getViewById = getViewById;
module.exports = that;


function validateConfig(config){
    var error = [];

    config.disabled = !!config.disabled;

    if (!config.id){ config.id = parseInt(Math.random() * new Date().getTime() * 10000000).toString(36).toUpperCase(); }

    // position
    //if (!config.position){ error.push('No position in config')}
    //else {
    //    if (config.position.x === undefined){ error.push('No x-position in config')}
    //    if (config.position.y === undefined){ error.push('No y-position in config')}
    //}

    // orientation
    if (!config.orientation ||
        config.orientation.toLowerCase() !== 'portrait' ||
        config.orientation.toLowerCase() !== 'landscape')
    {
        config.orientation = 'portrait'
    }
    else{
        config.orientation = config.orientation.toLowerCase();
    }

    // size
    if (!config.grid){ error.push('No grid sizes in config')}
    else {
        if (!config.grid.x){ error.push('No grid x-size in config')}
        if (!config.grid.y){ error.push('No grid y-size in config')}
    }

    return{ error: error};
}