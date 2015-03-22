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
});