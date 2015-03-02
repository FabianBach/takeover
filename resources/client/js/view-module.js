/**
 * VIEW MODULE BUILDER
 *
 * requires: moduleBuilder
 */

var viewBuilder = (function(){

    function init(callback){
        moduleBuilder.init(function(){
            callback();
        })
    }

    // TODO: landscape
    // TODO: disable orientation change
    function create (config){
        var template = createViewTemplate(config);
        var view = $(template);

        var width = config.grid.x;
        var height = config.grid.y;

        for (var control in config.controls){

            var controlConfig = config.controls[control];
            var controlNode = moduleBuilder.create(controlConfig);
            console.log('ControlNode:', controlNode);

            if(!controlNode){return console.error('Bad config for control: ', controlConfig);}


            //TODO: if bigger 100% or smaller 0% correct that;
            controlNode.css('height', (controlConfig.height / height * 100) +'%');
            controlNode.css('width', (controlConfig.width / width * 100) +'%');

            controlNode.css('top', (controlConfig.position.y / height * 100) +'%');
            controlNode.css('left', (controlConfig.position.x / width * 100) +'%');

            controlNode.appendTo(view);
        }

        console.log('View:',view);
        view.appendTo($('#controlWrapper'));
    }

    // TODO: get that html out of the js!
    function createViewTemplate (config){
        var template = '<div class="view-module" id="{{id}}" grid-x="{{gridX}} grid-y={{gridY}}">' +
            '<h1>{{viewTitle}}</h1>' +
            '</div>';

        template
            .replace('{{id}}', config.id);

        return template;
    }

    var that = {};
    that.init = init;
    that.create = create;
    return that;
})();