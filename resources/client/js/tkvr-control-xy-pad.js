tkvr.directive('tkvrXyPad', function(tkvrSocketIoSetup, tkvrControlPointerCoords){

    return tkvrXyPad = {
        restrict: 'EA',
        templateUrl: 'tkvr-xy-pad.tmpl.html',
        replace: true,
        link: link
        //TODO: scope?
    };

    function link(scope, element, attrs){

        //set up sockets for this element
        scope.control.xSocket = tkvrSocketIoSetup(scope.control.namespace.x, scope);
        scope.control.ySocket = tkvrSocketIoSetup(scope.control.namespace.y, scope);

        // set events on this element
        // link is the right place to do this
        element.on('pointerenter pointerdown', function(event){
            if (scope.control.isEnabled) {
                scope.control.hasFocus = true;
                scope.$digest();
            }
        });

        element.on('pointerleave', function(event){
            if(!scope.control.isActive){
                scope.control.hasFocus = false;
                scope.$digest();
            }

        });

        element.on('pointerdown', function(event){
            if (scope.control.isEnabled){
                scope.control.isActive = true;
                scope.control.xSocket.emit('in_use');
                scope.control.ySocket.emit('in_use');
                scope.$digest();
            }
        });

        $('html').on('pointerup pointercancel', function(event){
            scope.control.isActive = false;
            scope.control.xSocket.emit('use_end');
            scope.control.ySocket.emit('use_end');
            scope.$digest();
        });

        $('html').on('pointermove pointerdown', function(event){
            if(scope.control.hasFocus && scope.control.isActive && scope.control.isEnabled){

                var progress = tkvrControlPointerCoords(element, event);

                var maxValX = scope.control.maxValue.x;
                var maxValY = scope.control.maxValue.y;

                var minValX = scope.control.minValue.x;
                var minValY = scope.control.minValue.y;

                var xValue = parseInt(progress.x * maxValX);
                var yValue = parseInt(progress.y * maxValY);

                if(xValue < minValX){xValue = minValX}
                if(xValue > maxValX){xValue = maxValX}
                if(yValue < minValY){yValue = minValY}
                if(yValue > maxValY){yValue = maxValY}

                if(scope.control.value.x !== xValue){
                    scope.control.xSocket.emit('value_change', xValue);
                    onXValueChange(xValue)
                }

                if(scope.control.value.y !== yValue){
                    scope.control.ySocket.emit('value_change', yValue);
                    onYValueChange(yValue)
                }
            }
        });

        scope.control.xSocket.on('value_update', function(newValue){
            if (scope.control.isActive){ return }
            scope.control.value.x = newValue;
            onXValueChange(newValue);
        });

        scope.control.ySocket.on('value_update', function(newValue){
            if (scope.control.isActive){ return }
            scope.control.value.y = newValue;
            onYValueChange(newValue);
        });


        function onXValueChange(newValue){
            scope.control.value.x = newValue;
            moveIndicator();
            //TODO: digest on every pointermove?
            //scope.$digest();
        }
        function onYValueChange(newValue){
            scope.control.value.y = newValue;
            moveIndicator();
            //TODO: digest on every pointermove?
            //scope.$digest();
        }

        function moveIndicator(){
            //TODO: angular way?
            var progress = {
                    x: scope.control.value.x / scope.control.maxValue.x,
                    y: scope.control.value.y / scope.control.maxValue.y
                };

            element.find('.indicator').css('top', (1-progress.y)*100 +'%');
            element.find('.indicator').css('left', (progress.x)*100 +'%');
        }
    }
});