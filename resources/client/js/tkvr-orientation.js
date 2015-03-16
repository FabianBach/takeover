tkvr.factory('tkvrOrientation', function(){

    //This will be run only ONCE. Nice!
    var orientation = {};
    var watchers = [];
    window.addEventListener("resize", observeOrientation, false);
    checkIfOrientationChanged();

    return {
        watch: watchOrientation,
        get: getOrientation
    };

    function observeOrientation(){
        if (checkIfOrientationChanged()){
            callWatchers();
        }
    }

    function checkIfOrientationChanged() {
        var oldValue = orientation.name;

        orientation.isPortrait = window.innerWidth < window.innerHeight;
        orientation.isLandscape = !orientation.isPortrait;
        orientation.name = orientation.isPortrait ? 'portrait' : 'landscape';

        return orientation.name != oldValue;
    }

    function watchOrientation(callback){
        addWatcher(callback);
        //callback(orientation);
        console.log(orientation);
        return orientation;
    }

    function addWatcher(callback){
        watchers.push(callback);
    }

    function callWatchers(){
        for (var i=0; i < watchers.length; i++){
            watchers[i](orientation);
        }
    }

    function getOrientation(){
        return orientation;
    }

});