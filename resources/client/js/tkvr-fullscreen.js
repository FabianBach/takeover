tkvr.directive('tkvrFullscreen', function(){

    return tkvrControl = {
        restrict: 'A',
        compile: compile
    };

    function compile(element, attrs){
        //nothing to do I guess...
        return link;
    }

    function link(scope, element, attrs){

        //make the page fullscreen
        if (screenfull && screenfull.enabled) {
            element.on('pointerdown', function(){
                screenfull.request();
            });
        }
    }
});