// Angular service
// Used to set up the websockets for the control modules.
// Sets up all the listeners for server sent events
// and sets flags in that scope.
tkvr.factory('tkvrSocketIoSetup', function(){
    return function socketSetup(namespace, scope){
        var socket = io.connect(window.location.origin + namespace,{'forceNew': false })
            .on('disable', function(){
                console.log('Disable:', scope.control.title, scope.control.id);
                scope.control.isDisabled = true;
                scope.control.isEnabled = false;
                scope.control.isActive = false;
                scope.$digest(); // TODO: $call would be better?
            })
            .on('enable', function(){
                console.log('Enable:', scope.control.title, scope.control.id);
                scope.control.isEnabled = true;
                scope.control.isDisabled = false;
                scope.control.isOccupied = false;
                scope.$digest(); // TODO: $call would be better?
            })
            .on('occupied', function(flag){
                console.log('Occupied:', flag, scope.control.title, scope.control.id);
                scope.control.isOccupied = flag;
                scope.$digest(); // TODO: $call would be better?
            })
            .on('connect', function(){
                //console.log('Connected', scope.control.title, scope.control.id);
            })
            .on('disconnect', function(){
                //console.log('Disconnected', scope.control.title, scope.control.id);
                scope.control.isDisabled = true;
                scope.control.isEnabled = false;
                scope.control.isActive = false;
                scope.$digest(); // TODO: $call would be better?
            });

        // fix to reconnect to namespace
        // if someone comes back to this control module
        // in same or different view
        if(!socket.connected){
            socket.connect();
            console.log('Reconnected', scope.control.title, scope.control.id);
        }

        scope.$on("$destroy", function(){
            socket.removeAllListeners();
            socket.disconnect(); // or end(), is the same?
            //socket.destroy(); // not good
        });
        return socket;
    };
});