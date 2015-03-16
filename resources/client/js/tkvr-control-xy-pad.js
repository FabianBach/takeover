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
                scope.$digest();
            }
        });

        $('html').on('pointerup pointercancel', function(event){
            scope.control.isActive = false;
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
                    scope.control.value.x = xValue;
                }

                if(scope.control.value.y !== yValue){
                    scope.control.ySocket.emit('value_change', yValue);
                    scope.control.value.y = yValue;
                }

                element.find('.indicator').css('top', (1-progress.y)*100 +'%');
                element.find('.indicator').css('left', (progress.x)*100 +'%');

                //TODO: need to digest on every mouse move?
                //scope.$digest();
            }
        });
    }
});