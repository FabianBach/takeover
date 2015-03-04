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
            console.log('tkvr-view-list', data);
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


//Magic with $compile

tkvr.directive('tkvrControl', function($compile){

    return tkvrControl = {
        restrict: 'EA',
        compile: compile
    };

    function compile(element, attrs){
        //nothing to do I guess...
        return link;
    }

    function link(scope, element, attrs){
        var template = '<div tkvr-'+ scope.control.type +'>{{control.title}}</div>';

        var newElement = $compile(template)(scope);

        //TODO: replace this element
        element.append(newElement);
    }

});


// C O N T R O L S

tkvr.directive('tkvrButton', function(){

    return tkvrButton = {
        restrict: 'EA',
        templateUrl: 'tkvr-button.tmpl.html',
        //template: 'tkvr button digga!',
        link: link
    };

    function link(scope, element, attrs){

        console.log('SCOPE', scope);

        //TODO: position this thing
        //TODO: somehow let a service do that!?
        var width = scope.view.grid.x;
        var height = scope.view.grid.y;

        //TODO: if bigger 100% or smaller 0% correct that;
        element.css('height', (scope.control.height / height * 100) +'%');
        element.css('width', (scope.control.width / width * 100) +'%');

        element.css('top', (scope.control.position.y / height * 100) +'%');
        element.css('left', (scope.control.position.x / width * 100) +'%');

        //TODO: these nodes are needed for classes and attrs only and should be removed!
        element.inputNode = element.find('[value-holder]');
        element.disableNode = element.find('[disable-holder]');

        //TODO: set up sockets on this thing
        console.log(window.location.origin + scope.control.namespace);
        scope.control.socket = io.connect(window.location.origin + scope.control.namespace)
            .on('disable', function(){
                //TODO: set attr via angular binding
                element.disableNode.attr('disabled', true);
                scope.control.isDisabled = true;
                scope.control.isEnabled = false;
            })
            .on('enable', function(){
                //TODO: set attr via angular binding
                element.disableNode.removeAttr('disabled');
                scope.control.isDisabled = false;
                scope.control.isEnabled = true;
            });

        //TODO: set events on this thing
        element.inputNode.on('pointerdown', function(){
            if(scope.control.isEnabled){
                scope.control.socket.emit('value_change', scope.control.maxValue);
                scope.control.isActive = true;
                //TODO: do via angluar class directive
                element.inputNode.addClass('active');
            }
        });
        $('html').on('pointerup pointercancel', function(){
            if(scope.control.isActive){
                scope.control.socket.emit('value_change', scope.control.minValue);
                scope.control.isActive = false;
                //TODO: do via angluar class directive
                element.inputNode.removeClass('active');
            }
        });


    }
});


tkvr.service('viewList', function(){


});