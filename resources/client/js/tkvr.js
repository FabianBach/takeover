/**
 * Created by Farting Dog on 02.03.2015.
 */

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
                scope.control.isDisabled = true;
                scope.control.isEnabled = false;
            })
            .on('enable', function(){
                scope.control.isDisabled = false;
                scope.control.isEnabled = true;
            });

        // set events on this element
        // link is the right place to do this
        element.on('pointerdown', function(){
            if(scope.control.isEnabled){
                scope.control.socket.emit('value_change', scope.control.maxValue);
                scope.control.isActive = true;
                //TODO: do via angluar class directive
                element.addClass('active');
            }
        });
        $('html').on('pointerup pointercancel', function(){
            if(scope.control.isActive){
                scope.control.socket.emit('value_change', scope.control.minValue);
                scope.control.isActive = false;
                //TODO: do via angluar class directive
                element.removeClass('active');
            }
        });
    }
});




tkvr.directive('tkvrSlider', function(){

    return tkvrButton = {
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
                scope.control.isDisabled = true;
                scope.control.isEnabled = false;
            })
            .on('enable', function(){
                scope.control.isDisabled = false;
                scope.control.isEnabled = true;
            });

        // set events on this element
        // link is the right place to do this
        element.on('pointerenter', function(event){
            if (scope.control.isEnabled){ scope.control.hasFocus = true; }
        });

        element.on('pointerleave', function(event){
            scope.control.hasFocus = false;
            //scope.control.active = false;
        });

        element.on('pointerdown', function(event){
            if (scope.control.isEnabled){
                scope.control.isActive = true;
                element.addClass('active');
            }
        });

        $('html').on('pointerup pointercancel', function(event){
            scope.control.isActive = false;
            element.removeClass('active');
        });

        element.on('pointermove pointerdown', function(event){
            if(scope.control.hasFocus && scope.control.isActive){

                //TODO: if vertical use y

                var xZero = element.offset().left;
                //var yZero = element.offset().top;

                var xMax = element.width();
                //var yMax = element.height();

                var deltaX = event.pageX - xZero;
                //var deltaY = event.pageY - yZero;

                var progressX = deltaX / xMax;
                //var progressY = deltaY / yMax;

                var maxValX = parseInt(element.attr('max-value'));
                //var maxValY = parseInt(element.attr('y-max-value'));

                var minValX = parseInt(element.attr('min-value'));
                //var minValY = parseInt(element.attr('min-value'));

                var value = progressX * maxValX;

                if(value < minValX){value = minValX}
                if(value > maxValX){value = maxValX}

                if(scope.control.value !== parseInt(value)){
                    scope.control.socket.emit('value_change', value);
                    scope.control.value = value;
                }

                //TODO: anglular way?
                element.find('.indicator').css('right', (1-progressX)*100 +'%');

            }
        });
    }
});