app.controller("TryFonts", ['$scope', '$http', function($scope, $http) {

	$scope.fonts = $http.get('/webfonts.json');;
	$scope.myFonts = fileList;

}]);