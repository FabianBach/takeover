// Angular directive
// makes the website to be displayed fullscreen
// when the user clicks on an element containing the tkvrFullscreen attribute.

// // CURRENTLY OUT OF ORDER - WILL NOT DO ANYTHING // //

tkvr.directive('tkvrFullscreen', function(){

    return tkvrControl = {
        restrict: 'A',
        compile: compile
    };

    function compile(element, attrs){
        // we don't need the compile function I guess... // TODO: link only
        return link;
    }

    function link(scope, element, attrs){

        // make the page fullscreen
        // the request has to happen on some kind of user triggered event
        if (screenfull && screenfull.enabled) {
            element.on('pointerdown', function(){
                // D E A C T I V A T E D //
                //screenfull.request();
            });
        }
    }
});