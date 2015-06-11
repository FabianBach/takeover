// Angular service
// Provides a callback service when orientation of viewport changes.
// Simply compares the dimensions of the viewport when it is resized.
// the code inside will be called once only, no matter how often the service is used.
tkvr.factory('tkvrOrientation', function(){

    var orientation = {};
    var watchers = [];
    window.addEventListener("resize", observeOrientation, false);
    checkIfOrientationChanged();

    // returning the public interface of this service
    return {
        watch: watchOrientation,
        get: getOrientation
    };

    // callback function for the resize event
    function observeOrientation(){
        if (checkIfOrientationChanged()){
            callWatchers();
        }
    }

    // check current orientation and compare it with previous.
    // returns true if orientation has actually changed
    function checkIfOrientationChanged() {
        var oldValue = orientation.name;

        orientation.isPortrait = window.innerWidth < window.innerHeight;
        orientation.isLandscape = !orientation.isPortrait;
        orientation.name = orientation.isPortrait ? 'portrait' : 'landscape';

        return orientation.name != oldValue;
    }

    // public method to add a callback on orientation change
    // returns current orientation
    function watchOrientation(callback){
        addWatcher(callback);
        //callback(orientation);
        console.log(orientation);
        return orientation;
    }


    // private method to add a callback in private list
    function addWatcher(callback){
        watchers.push(callback);
    }

    // private method to notify all the watchers
    // by calling all their callbacks
    function callWatchers(){
        for (var i=0; i < watchers.length; i++){
            watchers[i](orientation);
        }
    }

    // public method to simply get the current orientation
    function getOrientation(){
        return orientation;
    }

});