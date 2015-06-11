// simple function that returns the position of an click event
// relative to the clicked element as a number between 0 to 1.
tkvr.factory('tkvrControlPointerCoords', function(){

    return function(element, event){
        // getting the position of the element in the viewport
        var xZero = element.offset().left;
        var yZero = element.offset().top;

        // get the dimensions of the element
        var xMax = element.width();
        var yMax = element.height();

        // make the event coords relative to the element
        var deltaX = event.pageX - xZero;
        var deltaY = event.pageY - yZero;

        // get the percentage of the event inside of the element
        var progressX = deltaX / xMax;      // from left to right
        var progressY = 1 - deltaY / yMax;  // from bottom to top

        // check if event was outside of the element
        // and put it back inside
        if(progressX < 0){progressX = 0}
        if(progressX > 1){progressX = 1}
        if(progressY < 0){progressY = 0}
        if(progressY > 1){progressY = 1}

        return {
            x : progressX,
            y: progressY
        };
    }
});