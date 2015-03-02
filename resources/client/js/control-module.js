/**
 * CONTROL MODULE BUILDER
 *
 * requires sockets to be ready
 */

var controlModule = (function(){

    var $templates;

    function init(callback){
        getTemplates(function(){
            callback();
        })
    }

    function getTemplates(callback){

        if ($templates){ callback(); }

        $.ajax({
            url: 'all-modules.html',
            dataType: "html",
            success: success,
            fail: fail
        });

        function success (data){
            $templates = $(data.toString());
            callback();
        }

        function fail (){
            getTemplates(callback);
        }
    }

    function create (config){
        var node = createFromTemplate(config);
        var module = createModule(node, config);
        return module;
    }

    function createFromTemplate (config){

        var template = $templates.find('#' + config.type).html();
        if (!template) return console.warn('moduleBuilder: type not found in templates: ' + config.type);

        template = template
            .replace('{{id}}', config.id)
            .replace('{{type}}', config.type)
            .replace('{{name}}', config.name)
            .replace('{{title}}', config.title);

        switch(config.type){

            case 'xy-pad':
                template = template
                    .replace('{{valueX}}', config.value.x)
                    .replace('{{valueY}}', config.value.x)
                    .replace('{{minValueX}}', config.minValue.x)
                    .replace('{{minValueY}}', config.minValue.y)
                    .replace('{{maxValueX}}', config.maxValue.x)
                    .replace('{{maxValueY}}', config.maxValue.y);
                break;

            case '_abstract':
            case 'button':
            case 'slider':
            default:
            template = template
                .replace('{{value}}', config.value)
                .replace('{{minValue}}', config.minValue)
                .replace('{{maxValue}}', config.maxValue);
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
                    if (node.enabled){
                        node.active = true;
                        node.inputNode.addClass('active');
                    }
                });

                $('html').on('pointerup pointercancel', function(event){
                    node.active = false;
                    node.inputNode.removeClass('active');
                });

                node.inputNode.on('pointermove pointerdown', function(event){
                    if(node.focus && node.active){

                        //TODO: if vertical use y

                        var xZero = node.inputNode.offset().left;
                        //var yZero = node.inputNode.offset().top;

                        var xMax = node.inputNode.width();
                        //var yMax = node.inputNode.height();

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

                        if(parseInt(node.attr('value')) !== parseInt(value)){
                            node.socket.emit('value_change', value);
                            node.attr('x-value', value);
                        }

                        node.find('.progress').css('right', (1-progressX)*100 +'%');

                    }
                });

                break;


            case 'xy-pad':
                node.xSocket = connectSocket(config.namespace.x);
                node.ySocket = connectSocket(config.namespace.y);

                node.inputNode.on('pointerenter', function(event){
                    if (node.enabled){ node.focus = true; }
                });

                node.inputNode.on('pointerleave', function(event){
                    node.focus = false;
                    //node.active = false;
                });

                node.inputNode.on('pointerdown', function(event){
                    if (node.enabled){
                        node.active = true;
                        node.inputNode.addClass('active');
                    }
                });

                $('html').on('pointerup pointercancel', function(event){
                    node.active = false;
                    node.inputNode.removeClass('active');
                });

                node.inputNode.on('pointermove pointerdown', function(event){
                    if(node.focus && node.active){

                        var xZero = node.inputNode.offset().left;
                        var yZero = node.inputNode.offset().top;

                        var xMax = node.inputNode.width();
                        var yMax = node.inputNode.height();

                        var deltaX = event.pageX - xZero;
                        var deltaY = event.pageY - yZero;

                        var progressX = deltaX / xMax;      // from left to right
                        var progressY = 1 - deltaY / yMax;  // from bottom to top

                        var maxValX = parseInt(node.inputNode.attr('x-max-value'));
                        var maxValY = parseInt(node.inputNode.attr('y-max-value'));

                        var minValX = parseInt(node.inputNode.attr('x-min-value'));
                        var minValY = parseInt(node.inputNode.attr('y-min-value'));

                        var xValue = progressX * maxValX;
                        var yValue = progressY * maxValY;

                        if(xValue < minValX){xValue = minValX}
                        if(yValue < minValY){yValue = minValY}
                        if(xValue > maxValX){xValue = maxValX}
                        if(yValue > maxValY){yValue = maxValY}

                        if(parseInt(node.attr('x-value')) !== parseInt(xValue)){
                            node.xSocket.emit('value_change', xValue);
                            node.attr('x-value', xValue);
                        }

                        if(parseInt(node.attr('y-value')) !== parseInt(yValue)){
                            node.ySocket.emit('value_change', yValue);
                            node.attr('y-value', yValue);
                        }

                        node.find('.indicator').css('right', (1-progressX)*100 +'%');
                        node.find('.indicator').css('top', (1-progressY)*100 +'%');

                    }
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

    var that = {};

    that.init = init;
    that.create = create;

    return that;
})();