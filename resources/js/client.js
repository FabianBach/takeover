// This file contains just everything and should TODO split up to many files
// (but it works)


/**
 * CONTROL MODULE BUILDER
 */

var moduleBuilder = (function(){

    var $templates;

    function init(callback){
        getTemplates(function(){
            callback.call();
        })
    }

    function getTemplates(callback){

        $.ajax({
            url: 'all-modules.html',
            dataType: "html",
            success: success,
            fail: fail
        });

        function success (data){
            $templates = $(data.toString());
            callback.call();
        }

        function fail (){
            getTemplates(callback);
        }
    }

    function create (config){
        var template = createTemplate(config);
        var reference = createModule(template, config);
        $('#controls').append(reference);
    }

    function createTemplate (config){

        var template = $templates.find('#' + config.type).html();
        if (!template) return console.warn('moduleBuilder: type not found in templates');

        template = template.replace('{{id}}', config.id)
            .replace('{{type}}', config.type)
            .replace('{{name}}', config.name)
            .replace('{{title}}', config.title)
            .replace('{{minValue}}', config.minValue)
            .replace('{{maxValue}}', config.maxValue);

        switch(config.type){

            case '_abstract':
                break;

            case 'simple button':
                break;
        }

        return template;
    }

    function createModule(template, config){

        var $ref = $(template);

        $ref.socket = io.connect('/' + config.id);
        $ref.socket.on('connect', function(){
            console.log('Module ' + config.type + ' ' + config.name + ' ' + config.id + ' connected');
        });

        switch (config.type){

            case '_abstract':
                break;

            case 'simple-button':
                $ref.on('vmousedown', function(){
                    $ref.socket.emit('value_change', $ref.attr('max-value'))
                });
                $ref.on('vmouseup', function(){
                    $ref.socket.emit('value_change', $ref.attr('min-value'))
                });
                break;

            case 'simple-slider':
                $ref.on('change', function(){
                    $ref.socket.emit('value_change', this.value);
                });
                break;
        }

        $ref.socket.on('disable', function(){
            $ref.find('.input').attr('disabled', true);
            $ref.socket.emit('value_change', $ref.attr('min-value'))
        });

        $ref.socket.on('enable', function(){
            $ref.find('.input').removeAttr('disabled');
        });

        return $ref;
    }

    var that = {};

    that.init = init;
    that.create = create;

    return that;
})();


/**
 * WEBSOCKETS
 */
var startSockets = function(){

    var socket = io.connect('/');

    socket.on('connecting', function(){
        console.log('Connecting...');
    });

    socket.on('connect', function(){
        console.log('Connection to server established!');
    });

    socket.on('disconnect', function(){
        console.log('Disconnected.');
    });


    socket.on('reconnecting', function(){
        console.log('Reconnecting...');
    });
    socket.on('reconnect', function(){
        console.log('Reconnected.');
    });


    socket.on('connect_failed', function(){
        console.log('Connection failed!');
    });
    socket.on('error', function(){
        console.log('Error!');
    });


    moduleBuilder.init(function(){
        socket.emit('get_module_list');
    });

    socket.on('module_list', function(list){

        list = JSON.parse(list);
        $.each(list, function(key, value){
            moduleBuilder.create(value);
        });

    });
};

$(document).ready(function(){
    startSockets();
});
