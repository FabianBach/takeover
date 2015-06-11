// Angular directive
// This is a kind of a factory for the control elements.
// Doing magic stuff with $compile()()
tkvr.directive('tkvrControl', function($compile){

  return tkvrControl = {
      restrict: 'EA',
      compile: compile
  };

  // compile function is only needed to get access to the link functions
  function compile(element, attrs){
      return {
          pre: preLink,
          post: postLink
      }
  }

    // the pre-link function will be called at parent scopes first
    // and be going down to the child scopes
    // we will put a container for the control inside the grid
    // and append the control inside of it
    function preLink(scope, element, attrs){
        setViewTurnFlag(scope);
        controlContainer = applyViewGrid(scope, element);
        controlElement = appendControlElement(scope, element);
        checkControlOrientation(scope);
    }

    // the post-link function will be called at child scopes first
    // and be going up to the parent scopes
    // we will just set a listener on events fired in the scope
    function postLink(scope, element, attrs){
        scope.$on('orientationchange', function(event, orientation){
            setViewTurnFlag(scope);
            scope.orientation = orientation;
            applyViewGrid(scope, element);
            checkControlOrientation(scope);
        });
    }

    // this will position absolute the container of the control element
    function setViewTurnFlag(scope){
        // check if the view has to be rendered turned by 90 deg.
        var turnView = (scope.orientation.isPortrait && scope.view.isLandscape) ||
            (scope.orientation.isLandscape && scope.view.isPortrait);

        console.log(turnView);
        scope.view.turnView = turnView;
    }

    function applyViewGrid(scope, element){

        // this will position absolute the wrapper of the control element
        // and then append the control element to it as child
        var gridWidth = scope.view.turnView
            ? scope.view.grid.y
            : scope.view.grid.x;

        var gridHeight = scope.view.turnView
            ? scope.view.grid.x
            : scope.view.grid.y;

        var elementWidth = scope.view.turnView
            ? scope.control.height
            : scope.control.width;

        var elementHeight = scope.view.turnView
            ? scope.control.width
            : scope.control.height;

        var elementPosX = scope.view.turnView
            ? scope.control.position.y
            : scope.control.position.x;
            //: scope.view.grid.y - scope.control.position.y - scope.control.height;

        var elementPosY = scope.view.turnView
            ? scope.control.position.x
            : scope.control.position.y;

        //TODO: if reaching out of grid correct that;
        element.css('width', (elementWidth / gridWidth * 100) +'em');
        element.css('height', (elementHeight / gridHeight * 100) +'em');

        element.css('right', (elementPosX / gridWidth * 100) +'em');
        element.css('top', (elementPosY / gridHeight * 100) +'em');

        return element;
    }

    // This function just sets the orientation of the control in its scope
    // by comparing the height and the width of it
    function checkControlOrientation(scope){
        scope.control.isVertical = scope.control.height > scope.control.width;
        scope.control.isHorizontal = !scope.control.isVertical;

        if (scope.view.turnView){
            scope.control.isVertical = !scope.control.isVertical;
            scope.control.isHorizontal = !scope.control.isHorizontal;
        }
    }

  // This is where the magic happens.
  // This function creates a simple template string for the control-type.
  // If we just append this string in the container, it will not be found by Angular.
  // So before appending it, we use the $compile function to register it in Angular
  // and run the link function of the directive and pass in its scope.
  function appendControlElement(scope, element){
    // build the simple template of the control directive
    var template = '<div tkvr-'+ scope.control.type +'>{{control.title}}</div>';
    // tell angular about the new created directive
    var newElement = $compile(template)(scope);
    // append the newly created element in its container in the grid
    element.append(newElement);
    return newElement;
  }
});