tkvr.factory('tkvrSocketIoSetup', function(){
    return function socketSetup(namespace, scope){
        var socket = io.connect(window.location.origin + namespace,{'forceNew': false })
            .on('disable', function(){
                console.log('Disable:', scope.control.title);
                scope.control.isDisabled = true;
                scope.control.isEnabled = false;
                scope.control.isActive = false;
                scope.$digest();
            })
            .on('enable', function(){
                console.log('Enable:', scope.control.title);
                scope.control.isDisabled = false;
                scope.control.isEnabled = true;
                scope.$digest();
            })
            .on('connect', function(){
                console.log('Connected', scope.control.title);
            })
            .on('disconnect', function(){
                console.log('Disconnected', scope.control.title);
            });

        if(!socket.connected){
            socket.connect();
            console.log('Reconnected', scope.control.title);
        }

        scope.$on("$destroy", function(){
            socket.removeAllListeners();
            socket.disconnect(); // or end(), is the same?
            //socket.destroy(); // not good
        });
        return socket;
    };
});