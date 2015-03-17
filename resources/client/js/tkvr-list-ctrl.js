tkvr.controller('tkvrListCtrl', function($scope, $http, tkvrOrientation){

    $http.get('/tkvr-view-list/').
        success(function(data, status, headers, config) {
            $scope.viewList = data
        }).
        error(function(data, status, headers, config) {
            $scope.viewList = [];
            // log error
        });


    if(!$scope.orientation){
        $scope.orientation = tkvrOrientation.watch(onOrientationChange);
    }
    function onOrientationChange(orientation){
        $scope.$broadcast('orientationchange', orientation);
        $scope.$digest();
    }

    //TODO: do that in some main controller or something
    //connect to main socket to establish namespace connections faster
    //$scope.socket = io.connect(window.location.origin);

});