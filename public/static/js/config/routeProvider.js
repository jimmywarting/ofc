/* global app */
app.config(['$locationProvider', '$httpProvider','$indexedDBProvider', function($locationProvider, $httpProvider, $indexedDBProvider) {
	
	$locationProvider.html5Mode(true);

	var $http,
	interceptor = ['$q', '$injector', function ($q, $injector) {

		function success(response) {
			return response;
		}

		function error(response) {
			if (response.status === 404 && response.config.url.indexOf("html")) {

				$http = $http || $injector.get('$http');

				var defer = $q.defer();
				$http.get('/npm_package_version/html/404')
				.then(function (result) {
					response.status = 200;
					response.data = result.data;
					defer.resolve(response);
				}, function () {
					defer.reject(response);
				});

				return defer.promise;
			} else {
				return $q.reject(response);
			}
		}

		return function (promise) {
			return promise.then(success, error);
		}
	}];

	$httpProvider.responseInterceptors.push(interceptor);
	


	$indexedDBProvider
		.connection('onlinefontconverter')
		.upgradeDatabase(3, function(event, db, tx){
			var objStore = db.createObjectStore('fontStore', {keyPath: 'id'});
		});

}]);