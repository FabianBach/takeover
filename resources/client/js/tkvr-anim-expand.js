tkvr.directive('tkvrAnimExpand', function(){

    return tkvrButton = {
        restrict: 'A',
        link: link
    };

    function link(scope, element, attrs){

        // set events on this element
        // link is the right place to do this
        element.on('click', function(event){

            var clickPos = event;
            console.log('CLICK', event);
            var effect = $('<div class="tkvr-anim-expand"></div>');

            //set position
            //effect.top = event.clientY;
            //effect.left = event.clientX;

            $('body').append(effect);

            //now react to css animation finish
            effect.remove();
        });
    }
});