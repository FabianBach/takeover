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
        scope.control.socket = tkvrSocketIoSetup(scope.control.namespace, scope);

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
            if (scope.control.isEnabled && !scope.control.isActive){
                scope.control.isActive = true;
                scope.control.socket.emit('in_use');
                scope.$digest();
            }
        });

        $('html').on('pointerup pointercancel', function(event){
            if (!scope.control.isActive){ return }
            scope.control.isActive = false;
            scope.control.socket.emit('use_end');
            scope.$digest();
        });

        $('html').on('pointermove pointerdown', function(event){
            if(scope.control.hasFocus && scope.control.isActive && scope.control.isEnabled){

                var progress = tkvrControlPointerCoords(element, event);

                var maxValX = scope.control.maxValue;
                var maxValY = scope.control.maxValue;

                var minValX = scope.control.minValue;
                var minValY = scope.control.minValue;

                var xValue = parseInt(progress.x * maxValX);
                var yValue = parseInt(progress.y * maxValY);

                if(xValue < minValX){xValue = minValX}
                if(xValue > maxValX){xValue = maxValX}
                if(yValue < minValY){yValue = minValY}
                if(yValue > maxValY){yValue = maxValY}

                if(scope.control.value.x !== xValue
                || scope.control.value.y !== yValue){

                    var newValue = {x: xValue, y: yValue};
                    scope.control.socket.emit('value_change', newValue);
                    onValueChange(newValue);
                }
            }
        });

        scope.control.socket.on('value_update', function(newValue){
            if (scope.control.isActive){ return }
            scope.control.value = newValue;
            onValueChange(newValue);
        });

        function onValueChange(newValue){
            scope.control.value = newValue;
            moveIndicator();
            //TODO: digest on every pointermove?
            //scope.$digest();
        }

        function moveIndicator(){
            //TODO: angular way?
            var progress = {
                    x: scope.control.value.x / scope.control.maxValue,
                    y: scope.control.value.y / scope.control.maxValue
                };

            element.find('.indicator').css('top', (1-progress.y)*100 +'%');
            element.find('.indicator').css('left', (progress.x)*100 +'%');
        }
    }
});