
// this function will return a new object with its own private scope and public methods
// it can be handed a configuration object
// somehow like a factory
var template = function(config){

    /*
     * ** PRIVATE STUFF **
     */
    // this class does not inherit from any other class
    // so we start with a new and empty object
    // this object will be returned at the end
    var that = {};

    // everything is private and can not be invoked outside of this scope
    // function will be appended to the returned object
    var privateVar1,
        privateVar2;

    // this function will be called at first
    // it will validate the configuration and set the super object to inherit from
    function init(){

        var validation = validateConfig(config);
        if (validation.error.length) return {error: validation.error};

        that = {};

        var appliance = applyConfig(config);
        if (appliance.error.length) return {error: appliance.error};

    };


    // use the information provided in the validated configuration to set and override variables of the object
    function applyConfig(config){

        privateVar1 = config.Var1;
        privateVar2 = config.Var2;

    };

    //if something goes wrong do not return an instance but an object containing information about the error
    var initialization = init();
    if (initialization.error) return {error: initialization.error};

    /*
     * ** PUBLIC STUFF **
     */

    // now add the functions, which are supposed to be public, to the object
    // that.methodName = funcName;

    // return the finished object (somewhat an instance of the module object)
    return that;
};

// return the specified object when using require()
module.exports = template;

/*
 * ** STATIC STUFF **
 * the following stuff will not be altered at runtime
 * and will be the same for every instance of the module
 */

// this function will check for errors in the config object
// every module will check for its specific config values
// but will not have to check for the values the super-object is checking for
function validateConfig(config){

    error = [];

    // if (something wrong) error.push('some error message for debuging');

    if (!config.Var1) error.push('Var1 not defined in config!');
    if (!config.Var2) error.push('Var2 not defined in config!');

    return {error: error};
};