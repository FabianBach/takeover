// Magic with $compile
tkvr.directive('tkvrControl', function($compile){

    return tkvrControl = {
        restrict: 'EA',
        compile: compile
    };

    function compile(element, attrs){
        //nothing to do I guess...
        return {
            pre: preLink,
            post: postLink
        }
    }

    function preLink(scope, element, attrs){
        controlContainer = applyViewGrid(scope, element);
        controlElement = appendControlElement(scope, element);
        checkControlOrientation(scope);
    }

    function postLink(scope, element, attrs){
        scope.$on('orientationchange', function(event, orientation){
            scope.orientation = orientation;
            applyViewGrid(scope, element);
            checkControlOrientation(scope);
        });
    }

    function applyViewGrid(scope, element){
        // this will position absolute the wrapper of the control element
        // and then append the control element to it as child
        var gridWidth = scope.orientation.isPortrait
            ? scope.view.grid.x
            : scope.view.grid.y;

        var gridHeight = scope.orientation.isPortrait
            ? scope.view.grid.y
            : scope.view.grid.x;

        var elementWidth = scope.orientation.isPortrait
            ? scope.control.width
            : scope.control.height;

        var elementHeight = scope.orientation.isPortrait
            ? scope.control.height
            : scope.control.width;

        var elementPosX = scope.orientation.isPortrait
            ? scope.control.position.x
            : scope.view.grid.y - scope.control.position.y - scope.control.height;

        var elementPosY = scope.orientation.isPortrait
            ? scope.control.position.y
            : scope.control.position.x;

        //TODO: if bigger 100% or smaller 0% correct that;
        element.css('width', (elementWidth / gridWidth * 100) +'em');
        element.css('height', (elementHeight / gridHeight * 100) +'em');

        element.css('left', (elementPosX / gridWidth * 100) +'em');
        element.css('top', (elementPosY / gridHeight * 100) +'em');

        return element;
    }

    function checkControlOrientation(scope){
        scope.control.isVertical = scope.control.height > scope.control.width;
        scope.control.isHorizontal = !scope.control.isVertical;

        if (scope.orientation.isLandscape){
            scope.control.isVertical = !scope.control.isVertical;
            scope.control.isHorizontal = !scope.control.isHorizontal;
        }
    }

    function appendControlElement(scope, element){
        // Build child Element and $compile it to make it work
        var template = '<div tkvr-'+ scope.control.type +'>{{control.title}}</div>';
        var newElement = $compile(template)(scope);
        element.append(newElement);

        return newElement;
    }
});