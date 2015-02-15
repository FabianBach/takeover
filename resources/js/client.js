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
        afterAppend(module, config);
    }

    function createFromTemplate (config){

        var template = $templates.find('#' + config.type).html();
        if (!template) return console.warn('moduleBuilder: type not found in templates: ' + config.type);

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

            case 'slider':
                break;

            case 'xy-pad':
                break;
        }

        return $(template);
    }

    function createModule(node, config){

        node.inputNode = node.find('[value-holder]');
        node.disableNode = node.find('[disable-holder]');

        switch (config.type){

            case '_abstract':
                break;


            case 'button':
                node.socket = connectSocket(config.namespace);

                node.inputNode.on('pointerdown', function(){
                    if(node.enabled){
                        node.socket.emit('value_change', node.inputNode.attr('max-value'));
                        node.active = true;
                        node.inputNode.addClass('active');
                    }
                });
                $('html').on('pointerup pointercancel', function(){
                    if(node.active){
                        node.socket.emit('value_change', node.inputNode.attr('min-value'));
                        node.active = false;
                        node.inputNode.removeClass('active');
                    }
                });
                break;


            case 'slider':
                node.socket = connectSocket(config.namespace);

                node.inputNode.on('pointerenter', function(event){
                    if (node.enabled){ node.focus = true; }
                });

                node.inputNode.on('pointerleave', function(event){
                    node.focus = false;
                    //node.active = false;
                });

                node.inputNode.on('pointerdown', function(event){
                    if (node.enabled){ node.active = true; }
                });

                $('html').on('pointerup pointercancel', function(event){
                    node.active = false;
                });

                node.inputNode.on('pointermove pointerdown', function(event){
                    if(node.focus && node.active){

                        //TODO: if vertical use y

                        var xZero = node.inputNode[0].offsetLeft;
                        //var yZero = node.inputNode[0].offsetTop;

                        var xMax = node.inputNode[0].clientWidth;
                        //var yMax = node.inputNode[0].clientHeight;

                        var deltaX = event.pageX - xZero;
                        //var deltaY = event.pageY - yZero;

                        var progressX = deltaX / xMax;
                        //var progressY = deltaY / yMax;

                        var maxValX = parseInt(node.inputNode.attr('max-value'));
                        //var maxValY = parseInt(node.inputNode.attr('y-max-value'));

                        var minValX = parseInt(node.inputNode.attr('min-value'));
                        //var minValY = parseInt(node.inputNode.attr('min-value'));

                        var value = progressX * maxValX;

                        if(value < minValX){value = minValX}
                        if(value > maxValX){value = maxValX}

                        node.socket.emit('value_change', value);

                        node.find('.progress').css('right', (1-progressX)*100 +'%');

                    }
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

                    default :
                        node.disableNode.attr('disabled', true);
                        node.disabled = true;
                        node.enabled = false;
                }
            });

            socket.on('enable', function(){
                switch (config.type){

                    default :
                        node.disableNode.removeAttr('disabled');
                        node.disabled = false;
                        node.enabled = true;
                }
            });

            socket.on('value_update', function(data){
                console.log(data);
                switch (config.type){

                    default :
                        node.inputNode.attr('value', data);
                }
            });

            return socket;
        }

        return node;
    }

    function afterAppend(module, config){
        switch (config.type){

            case '_abstract':
                break;

            case 'button':
                break;

            case 'slider':
                break;

            case 'xy-pad':
                break;

        }
    }



    var module;

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
