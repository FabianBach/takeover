tkvr.controller('tkvrViewCtrl', function($scope, $http, $routeParams, tkvrOrientation){

    $http.get('/tkvr-view/' + $routeParams.id).
        success(function(data, status, headers, config) {
            $scope.view = data;
        }).
        error(function(data, status, headers, config) {
            $scope.view = [];
            // log error
        });

    if(!$scope.orientation){
        var noDigest = true;
        $scope.orientation = tkvrOrientation.watch(onOrientationChange);
    }

    function onOrientationChange(orientation){
        $scope.$broadcast('orientationchange', orientation);
        //FIXME: workaround
        //if (noDigest){
        //    noDigest = false;
        //}else{
        $scope.$digest();
        //}
    }

    //TODO: connect so main websocket to react on disconnect events and so on
});