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