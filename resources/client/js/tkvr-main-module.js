// Angular entrance point
// defines the tkvr Angular app
var tkvr = angular.module('tkvr', ['ngRoute']);

// Setting up the hash routes of the app
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

    // TODO:
    // connect to main socket to establish namespace connections faster
    // $scope.socket = io.connect(window.location.origin);
    // also disconnect the client on destroy event of angular
});