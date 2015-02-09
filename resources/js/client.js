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
        var node = createFromTemplate(config);
        var module = createModule(node, config);
        $('#controls').append(module);

        switch (config.type){

            case 'slider':
                module.inputNode.slider();
                break;

            default :
                break;
        }
    }

    function createFromTemplate (config){

        var template = $templates.find('#' + config.type).html();
        if (!template) return console.warn('moduleBuilder: type not found in templates');

        template = template
            .replace('{{id}}', config.id)
            .replace('{{type}}', config.type)
            .replace('{{name}}', config.name)
            .replace('{{title}}', config.title)
            .replace('{{value}}', config.value)
            .replace('{{minValue}}', config.minValue)
            .replace('{{maxValue}}', config.maxValue);

        switch(config.type){

            case '_abstract':
                break;

            case 'button':
                break;
        }

        return $(template);
    }

    function createModule(node, config){

        node.inputNode = node.find('.value-holder');
        node.disableNode = node.find('.disable-holder');

        switch (config.type){

            case '_abstract':
                break;

            case 'button':
                node.socket = connectSocket(config.namespace);

                node.socket.on('disable', function(){
                    node.socket.emit('value_change', node.inputNode.attr('min-value'))
                });

                node.inputNode.on('vmousedown', function(){
                    node.socket.emit('value_change', node.inputNode.attr('max-value'))
                });
                node.inputNode.on('vmouseup', function(){
                    node.socket.emit('value_change', node.inputNode.attr('min-value'))
                });
                break;

            case 'slider':
                node.socket = connectSocket(config.namespace);
                node.inputNode.on('change', function(event){
                    node.socket.emit('value_change', this.value);
                });
                break;

            case 'xy-pad':
                node.xSocket = connectSocket(config.namespace.x);
                node.ySocket = connectSocket(config.namespace.y);
                var sendXYCoords = function(event){
                    node.xSocket.emit('value_change', event.clientX);
                    node.ySocket.emit('value_change', event.clientY);
                };

                node.on('vmousemove', node.sendCoords);

                node.on('vmousedown', function(event) {
                    sendXYCoords(event);
                    node.sendCoords = sendXYCoords;
                });

                node.on('vmouseup', function(){
                    node.sendCoords = function(){};
                });
                break;
        }

        function connectSocket(namespace){
            namespace = namespace.replace('/', '');
            var socket = io.connect(window.location.toString() + namespace);

            socket.on('disable', function(){
                switch (config.type){
                    case 'slider':
                        node.disableNode.slider('disable');
                        break;

                    default :
                        node.disableNode.attr('disabled', true);
                }
            });

            socket.on('enable', function(){
                switch (config.type){
                    case 'slider':
                        node.disableNode.slider('enable');
                        node.inputNode.slider('refresh');
                        break;

                    default :
                        node.disableNode.removeAttr('disabled');
                }
            });

            socket.on('value_update', function(data){
                console.log(data);
                switch (config.type){
                    case 'slider':
                        node.inputNode.attr('value', data);
                        node.inputNode.slider('refresh');
                        break;

                    default :
                        node.inputNode.value(data);
                }
            });

            return socket;
        }

        return node;
    }



    var module

    var that = {};

    that.init = init;
    that.create = create;

    return that;
})();


/**
 * WEBSOCKETS
 */
var startSockets = function(){

    //var socket = io.connect('/');
    var socket = io.connect(window.location.toString());

    socket.on('connecting', function(){
        console.log('Connecting...');
    });

    socket.on('connect', function(){
        console.log('Connection to server established!');
    });

    socket.on('disconnect', function(){
        console.log('Disconnected.');
        //TODO: disable all inputs?
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
