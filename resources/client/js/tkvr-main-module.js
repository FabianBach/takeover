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

    // TODO: do that in some main controller or something
    // connect to main socket to establish namespace connections faster
    // check if connected regulary
    // and broadcast some disconnect event in rootScope on timeout
    //$scope.socket = io.connect(window.location.origin);

    // TODO: also disconnect the client on destroy event of angular
});