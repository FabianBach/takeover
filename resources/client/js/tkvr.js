/**
 * Created by Farting Dog on 02.03.2015.
 */

var tkvr = angular.module('tkvr', ['ngRoute']);

tkvr.config(function($routeProvider){
    $routeProvider
        .when('/view/:id', {
            controller: 'tkvrViewCtrl',
            templateUrl: 'tkvr-view.html'
        })
        .when('/list', {
            controller: 'tkvrListCtrl',
            templateUrl: 'tkvr-list.html'
        })
        .otherwise({
            redirectTo: '/list'
        })
});

tkvr.controller('tkvrListCtrl', function($scope){

});

tkvr.controller('tkvrViewCtrl', function($scope, $routeParams){
    $scope.view = {};
    $scope.view.id = $routeParams.id;
});

tkvr.directive('tvkrButton', function($scope, element, something){

    var tkvrButton = {
        restrict: 'E',
        scope: {},
        template: 'tkvrButton.tmpl.html'
    };

    return tkvrButton;
});



tkvr.service('viewList', function(){

});