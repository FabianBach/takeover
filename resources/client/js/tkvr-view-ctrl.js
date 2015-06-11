// Angular controller
// used for single control view
// Gets the information of the view via ajax
tkvr.controller('tkvrViewCtrl', function($scope, $http, $routeParams, tkvrOrientation){

    $http.get('/tkvr-view/' + $routeParams.id).
        success(function(data, status, headers, config) {
            $scope.view = data;
            $scope.view.isPortrait = $scope.view.orientation === 'portrait';
            $scope.view.isLandscape = $scope.view.orientation === 'landscape';
        }).
        error(function(data, status, headers, config) {
            $scope.view = [];
            // TODO: log error and try to get that view again
        });

    // listen to orientation changes of orientation directive
    if(!$scope.orientation){
        $scope.orientation = tkvrOrientation.watch(onOrientationChange);
    }

    // will tell the scope about orientation change, such as the control elements
    function onOrientationChange(orientation){
        $scope.$broadcast('orientationchange', orientation);
        $scope.$digest();
    }
});