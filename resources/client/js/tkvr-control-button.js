tkvr.directive('tkvrButton', function(tkvrSocketIoSetup, tkvrControlPointerCoords){

    return tkvrButton = {
        restrict: 'EA',
        templateUrl: 'tkvr-button.tmpl.html',
        replace: true,
        link: link
        //TODO: scope?
    };

    function link(scope, element, attrs){

        //set up sockets for this element
        scope.control.socket = tkvrSocketIoSetup(scope.control.namespace, scope);

        // set events on this element
        // link is the right place to do this
        element.on('pointerdown', function(event){
            if(scope.control.isEnabled){
                scope.control.socket.emit('value_change', scope.control.maxValue);
                scope.control.isActive = true;
                scope.$digest();

                var progress = tkvrControlPointerCoords(element, event);

                element.find('.indicator').css('top', (1-progress.y)*100 +'%');
                element.find('.indicator').css('left', (progress.x)*100 +'%');
            }
        });

        $('html').on('pointerup pointercancel', function(){
            if(scope.control.isEnabled && scope.control.isActive){
                scope.control.socket.emit('value_change', scope.control.minValue);
                scope.control.isActive = false;
                scope.$digest();
            }
        });

        scope.control.socket
            .on('value_update', function(newValue){
                onValueChange(newValue);
            });

        function onValueChange(newValue){
            scope.control.value = newValue;
            scope.control.isActive = !!newValue;
            scope.$digest();
        }
    }
});