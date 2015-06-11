// Angular directive for control module: button
// this directive will be called by the tkvrControl directive with $compile()()
// It defines the individual behaviour of the control module, mainly its events
tkvr.directive('tkvrButton', function(tkvrSocketIoSetup, tkvrControlPointerCoords){

    return tkvrButton = {
        restrict: 'EA',
        templateUrl: 'tkvr-button.tmpl.html',
        replace: true,
        link: link
    };

    function link(scope, element, attrs){

        //set up sockets and its Namespace for this element
        scope.control.socket = tkvrSocketIoSetup(scope.control.namespace, scope);

        // set events on this element
        // link is the right place to do this
        // TODO: pointerId to enable multitouch
        element.on('pointerdown', function(event){
            if(scope.control.isEnabled && !scope.control.isActive){
                scope.control.socket.emit('in_use');
                scope.control.socket.emit('value_change', scope.control.maxValue);
                scope.control.isActive = true;
                scope.$digest(); // TODO: $call would be better?

                var progress = tkvrControlPointerCoords(element, event);

                element.find('.indicator').css('top', (1-progress.y)*100 +'%');
                element.find('.indicator').css('left', (progress.x)*100 +'%');
            }
        });

        $('html').on('pointerup pointercancel', function(){
            if(scope.control.isEnabled && scope.control.isActive){
                scope.control.socket.emit('value_change', scope.control.minValue);
                scope.control.socket.emit('use_end');
                scope.control.isActive = false;
                scope.$digest(); // TODO: $call would be better?
            }
        });

      // set up a listener for foreign value changes
      // so that new value can be updated in real time
      // TODO: put that in socket-service
      scope.control.socket
            .on('value_update', function(newValue){
                onValueChange(newValue);
            });

        function onValueChange(newValue){
            scope.control.value = newValue;
            scope.$digest(); // TODO: $call would be better?
        }
    }
});