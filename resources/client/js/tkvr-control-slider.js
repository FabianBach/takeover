tkvr.directive('tkvrSlider', function(tkvrSocketIoSetup, tkvrControlPointerCoords){

    return tkvrSlider = {
        restrict: 'EA',
        templateUrl: 'tkvr-slider.tmpl.html',
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
            if (scope.control.isEnabled){
                scope.control.hasFocus = true;
                //scope.$digest();
            }
        });

        element.on('pointerleave', function(event){
            if(!scope.control.isActive){
                scope.control.hasFocus = false;
                //scope.$digest();
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
            scope.control.hasFocus = false;
            scope.$digest();
        });

        $('html').on('pointermove pointerdown', function(event){
            if(!(scope.control.hasFocus
                && scope.control.isEnabled
                && scope.control.isActive)){ return }


            var progress = {};
            if (scope.control.isVertical){
                progress = tkvrControlPointerCoords(element, event).y
            } else {
                progress = tkvrControlPointerCoords(element, event).x
            }

            var maxVal = scope.control.maxValue;
            var minVal = scope.control.minValue;

            var value = parseInt(progress * maxVal);

            if(value < minVal){value = minVal}
            if(value > maxVal){value = maxVal}

            if(scope.control.value !== value){
                scope.control.socket.emit('value_change', value);
                scope.control.value = value;
                //TODO: angular way?
                if (scope.control.isVertical){
                    element.find('.indicator').css('top', (1-progress)*100 +'%');
                } else {
                    element.find('.indicator').css('left', (progress)*100 +'%');
                }

                //TODO: digest on every pointermove?
                //scope.$digest();
            }
        });
    }
});