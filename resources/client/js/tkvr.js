/**
 * Created by Farting Dog on 02.03.2015.
 */

    //TODO: make like 10 Files out of this and use Grunt to concat...

var tkvr = angular.module('tkvr', ['ngRoute']);

tkvr.config(function($routeProvider){

    //Set up the routes
    $routeProvider
        .when('/list', {
            controller: 'tkvrListCtrl',
            templateUrl: 'tkvr-list.html'
        })
        .when('/view/:id', {
            controller: 'tkvrViewCtrl',
            templateUrl: 'tkvr-view.html'
        })
        .otherwise({
            redirectTo: '/list'
        });

    //TODO: somehow connect to main socket here or in some main controller
    // and disconnect on destroy or on timeout
});



tkvr.controller('tkvrListCtrl', function($scope, $http){

    $http.get('/tkvr-view-list/').
        success(function(data, status, headers, config) {
            $scope.viewList = data
        }).
        error(function(data, status, headers, config) {
            $scope.viewList = [];
            // log error
        });

    //TODO: do that in some main controller or something
    //connect to main socket to establish namespace connections faster
    //$scope.socket = io.connect(window.location.origin);

});


tkvr.controller('tkvrViewCtrl', function($scope, $http, $routeParams, tkvrOrientation){

    $http.get('/tkvr-view/' + $routeParams.id).
        success(function(data, status, headers, config) {
            $scope.view = data;
        }).
        error(function(data, status, headers, config) {
            $scope.view = [];
            // log error
        });

    if(!$scope.orientation){
        var noDigest = true;
        $scope.orientation = tkvrOrientation.watch(onOrientationChange);
    }

    function onOrientationChange(orientation){
        $scope.$broadcast('orientationchange', orientation);
        //FIXME: workaround
        //if (noDigest){
        //    noDigest = false;
        //}else{
            $scope.$digest();
        //}
    }

    //TODO: connect so main websocket to react on disconnect events and so on
});



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

// C O N T R O L - V I E W S
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


// C O N T R O L S
tkvr.directive('tkvrButton', function(tkvrSocketIoSetup, tkvrControlPointerCoords){

    return tkvrButton = {
        restrict: 'EA',
        templateUrl: 'tkvr-button.tmpl.html',
        replace: true,
        link: link
        //TODO: scope?
    };

    function link(scope, element, attrs){

        //set up sockets for this element
        scope.control.socket = tkvrSocketIoSetup(scope.control.namespace, scope);

        // set events on this element
        // link is the right place to do this
        element.on('pointerdown', function(event){
            if(scope.control.isEnabled){
                scope.control.socket.emit('value_change', scope.control.maxValue);
                scope.control.isActive = true;
                scope.$digest();

                var progress = tkvrControlPointerCoords(element, event);

                element.find('.indicator').css('top', (1-progress.y)*100 +'%');
                element.find('.indicator').css('left', (progress.x)*100 +'%');
            }
        });

        $('html').on('pointerup pointercancel', function(){
            if(scope.control.isActive){
                scope.control.socket.emit('value_change', scope.control.minValue);
                scope.control.isActive = false;
                scope.$digest();
            }
        });
    }
});




tkvr.directive('tkvrSlider', function(tkvrSocketIoSetup, tkvrControlPointerCoords){

    return tkvrSlider = {
        restrict: 'EA',
        templateUrl: 'tkvr-slider.tmpl.html',
        replace: true,
        link: link
        //TODO: scope?
    };

    function link(scope, element, attrs){

        //set up sockets for this element
        scope.control.socket = tkvrSocketIoSetup(scope.control.namespace, scope);

        // set events on this element
        // link is the right place to do this
        element.on('pointerenter pointerdown', function(event){
            if (scope.control.isEnabled){
                scope.control.hasFocus = true;
                //scope.$digest();
            }
        });

        element.on('pointerleave', function(event){
            if(!scope.control.isActive){
                scope.control.hasFocus = false;
                //scope.$digest();
            }
        });

        element.on('pointerdown', function(event){
            if (scope.control.isEnabled){
                scope.control.isActive = true;
                scope.$digest();
            }
        });

        $('html').on('pointerup pointercancel', function(event){
            scope.control.isActive = false;
            scope.control.hasFocus = false;
            scope.$digest();
        });

        $('html').on('pointermove pointerdown', function(event){
            if(!(scope.control.hasFocus
                && scope.control.isEnabled
                && scope.control.isActive)){ return }


            var progress = {};
            if (scope.control.isVertical){
                progress = tkvrControlPointerCoords(element, event).y
            } else {
                progress = tkvrControlPointerCoords(element, event).x
            }

            var maxVal = scope.control.maxValue;
            var minVal = scope.control.minValue;

            var value = parseInt(progress * maxVal);

            if(value < minVal){value = minVal}
            if(value > maxVal){value = maxVal}

            if(scope.control.value !== value){
                scope.control.socket.emit('value_change', value);
                scope.control.value = value;
                //TODO: angular way?
                if (scope.control.isVertical){
                    element.find('.indicator').css('top', (1-progress)*100 +'%');
                } else {
                    element.find('.indicator').css('left', (progress)*100 +'%');
                }

                //TODO: digest on every pointermove?
                //scope.$digest();
            }
        });
    }
});



tkvr.directive('tkvrXyPad', function(tkvrSocketIoSetup, tkvrControlPointerCoords){

    return tkvrXyPad = {
        restrict: 'EA',
        templateUrl: 'tkvr-xy-pad.tmpl.html',
        replace: true,
        link: link
        //TODO: scope?
    };

    function link(scope, element, attrs){

        //set up sockets for this element
        scope.control.xSocket = tkvrSocketIoSetup(scope.control.namespace.x, scope);
        scope.control.ySocket = tkvrSocketIoSetup(scope.control.namespace.y, scope);

        // set events on this element
        // link is the right place to do this
        element.on('pointerenter pointerdown', function(event){
            if (scope.control.isEnabled) {
                scope.control.hasFocus = true;
                scope.$digest();
            }
        });

        element.on('pointerleave', function(event){
            if(!scope.control.isActive){
                scope.control.hasFocus = false;
                scope.$digest();
            }

        });

        element.on('pointerdown', function(event){
            if (scope.control.isEnabled){
                scope.control.isActive = true;
                scope.$digest();
            }
        });

        $('html').on('pointerup pointercancel', function(event){
            scope.control.isActive = false;
            scope.$digest();
        });

        $('html').on('pointermove pointerdown', function(event){
            if(scope.control.hasFocus && scope.control.isActive && scope.control.isEnabled){

                var progress = tkvrControlPointerCoords(element, event);

                var maxValX = scope.control.maxValue.x;
                var maxValY = scope.control.maxValue.y;

                var minValX = scope.control.minValue.x;
                var minValY = scope.control.minValue.y;

                var xValue = parseInt(progress.x * maxValX);
                var yValue = parseInt(progress.y * maxValY);

                if(xValue < minValX){xValue = minValX}
                if(xValue > maxValX){xValue = maxValX}
                if(yValue < minValY){yValue = minValY}
                if(yValue > maxValY){yValue = maxValY}

                if(scope.control.value.x !== xValue){
                    scope.control.xSocket.emit('value_change', xValue);
                    scope.control.value.x = xValue;
                }

                if(scope.control.value.y !== yValue){
                    scope.control.ySocket.emit('value_change', yValue);
                    scope.control.value.y = yValue;
                }

                element.find('.indicator').css('top', (1-progress.y)*100 +'%');
                element.find('.indicator').css('left', (progress.x)*100 +'%');

                //TODO: need to digest on every mouse move?
                //scope.$digest();
            }
        });
    }
});