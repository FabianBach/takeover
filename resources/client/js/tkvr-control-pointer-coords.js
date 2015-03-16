tkvr.factory('tkvrControlPointerCoords', function(){

    return function(element, event){
        var xZero = element.offset().left;
        var yZero = element.offset().top;

        var xMax = element.width();
        var yMax = element.height();

        var deltaX = event.pageX - xZero;
        var deltaY = event.pageY - yZero;

        var progressX = deltaX / xMax;      // from left to right
        var progressY = 1 - deltaY / yMax;  // from bottom to top

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