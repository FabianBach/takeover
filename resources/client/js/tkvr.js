/**
 * Created by Farting Dog on 02.03.2015.
 */

    //TODO: make like 10 Files out of this and use Grunt to concat...

var tkvr = angular.module('tkvr', ['ngRoute']);

tkvr.config(function($routeProvider){
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
        })
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
});


tkvr.controller('tkvrViewCtrl', function($scope, $http, $routeParams){

    $http.get('/tkvr-view/' + $routeParams.id).
        success(function(data, status, headers, config) {
            $scope.view = data;
        }).
        error(function(data, status, headers, config) {
            $scope.view = [];
            // log error
        });
});



// C O N T R O L - V I E W S
// Magic with $compile
tkvr.directive('tkvrControl', function($compile){

    return tkvrControl = {
        restrict: 'EA',
        compile: compile
        //TODO: set some lower prio than repeat
    };

    function compile(element, attrs){
        //nothing to do I guess...
        return link;
    }

    function link(scope, element, attrs){

        // position the wrapper
        var width = scope.view.grid.x;
        var height = scope.view.grid.y;

        //TODO: if bigger 100% or smaller 0% correct that;
        element.css('height', (scope.control.height / height * 100) +'%');
        element.css('width', (scope.control.width / width * 100) +'%');

        element.css('top', (scope.control.position.y / height * 100) +'%');
        element.css('left', (scope.control.position.x / width * 100) +'%');

        // Build child Element and $compile it to make it work
        var template = '<div tkvr-'+ scope.control.type +'>{{control.title}}</div>';
        var newElement = $compile(template)(scope);
        element.append(newElement);
    }
});


// C O N T R O L S
tkvr.directive('tkvrButton', function(){

    return tkvrButton = {
        restrict: 'EA',
        templateUrl: 'tkvr-button.tmpl.html',
        replace: true,
        link: link
        //TODO: scope?
    };

    function link(scope, element, attrs){

        //set up sockets for this element
        //TODO: directive for that (?)
        scope.control.socket = io.connect(window.location.origin + scope.control.namespace)
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
            });

        // set events on this element
        // link is the right place to do this
        element.on('pointerdown', function(){
            if(scope.control.isEnabled){
                scope.control.socket.emit('value_change', scope.control.maxValue);
                scope.control.isActive = true;
                scope.$digest();
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




tkvr.directive('tkvrSlider', function(){

    return tkvrSlider = {
        restrict: 'EA',
        templateUrl: 'tkvr-slider.tmpl.html',
        replace: true,
        link: link
        //TODO: scope?
    };

    function link(scope, element, attrs){

        //set up sockets for this element
        //TODO: directive for that (?)
        scope.control.socket = io.connect(window.location.origin + scope.control.namespace)
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
            });

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
            if(scope.control.hasFocus
                && scope.control.isEnabled
                && scope.control.isActive){

                //TODO: if vertical use y

                var xZero = element.offset().left;
                //var yZero = element.offset().top;

                var xMax = element.width();
                //var yMax = element.height();

                var deltaX = event.pageX - xZero;
                //var deltaY = event.pageY - yZero;

                var progressX = deltaX / xMax;
                //var progressY = deltaY / yMax;

                if(progressX < 0){progressX = 0}
                if(progressX > 1){progressX = 1}
                //if(progressY < 0){progressY = 0}
                //if(progressY > 1){progressY = 1}

                var maxValX = scope.control.maxValue;
                //var maxValY = parseInt(element.attr('y-max-value'));

                var minValX = scope.control.minValue;
                //var minValY = parseInt(element.attr('min-value'));

                var value = progressX * maxValX;

                if(value < minValX){value = minValX}
                if(value > maxValX){value = maxValX}

                if(scope.control.value !== parseInt(value)){
                    scope.control.socket.emit('value_change', value);
                    scope.control.value = value;
                    //TODO: angular way?
                    element.find('.indicator').css('right', (1-progressX)*100 +'%');
                    //TODO: digest on every pointermove?
                    //scope.$digest();
                }
            }
        });
    }
});



tkvr.directive('tkvrXyPad', function(){

    return tkvrXyPad = {
        restrict: 'EA',
        templateUrl: 'tkvr-slider.tmpl.html',
        replace: true,
        link: link
        //TODO: scope?
    };

    function link(scope, element, attrs){

        //set up sockets for this element
        //TODO: directive for that (?)
        scope.control.xSocket = io.connect(window.location.origin + scope.control.namespace.x)
            .on('disable', disable)
            .on('enable', enable);

        scope.control.ySocket = io.connect(window.location.origin + scope.control.namespace.y)
            .on('disable', disable)
            .on('enable', enable);

        function enable(){
            console.log('Enable:', scope.control.title);
            scope.control.isDisabled = false;
            scope.control.isEnabled = true;
            scope.$digest();
        }
        function disable(){
            console.log('Disable:', scope.control.title);
            scope.control.isDisabled = true;
            scope.control.isEnabled = false;
            scope.control.isActive = false;
            scope.$digest();
        }

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

                var maxValX = scope.control.maxValue.x;
                var maxValY = scope.control.maxValue.y;

                var minValX = scope.control.minValue.x;
                var minValY = scope.control.minValue.y;

                var xValue = progressX * maxValX;
                var yValue = progressY * maxValY;

                if(xValue < minValX){xValue = minValX}
                if(xValue > maxValX){xValue = maxValX}
                if(yValue < minValY){yValue = minValY}
                if(yValue > maxValY){yValue = maxValY}

                if(scope.control.value.x !== parseInt(xValue)){
                    scope.control.xSocket.emit('value_change', xValue);
                    scope.control.value.x = xValue;
                }

                if(scope.control.value.y !== parseInt(yValue)){
                    scope.control.ySocket.emit('value_change', yValue);
                    scope.control.value.y = yValue;
                }

                element.find('.indicator').css('right', (1-progressX)*100 +'%');
                element.find('.indicator').css('top', (1-progressY)*100 +'%');

                //TODO: need to digest on every mouse move?
                //scope.$digest();
            }
        });
    }
});