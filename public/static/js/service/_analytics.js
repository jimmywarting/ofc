app.service('analytics', ['$rootScope', '$location', function($rootScope, $location) {

	$rootScope.$on('$viewContentLoaded', function() {
		var path = $location.path();
		window._gaq.push(['_trackPageview', path]);
		if(window.sessionCamRecorder && window.sessionCamRecorder.createVirtualPageLoad){
			window.sessionCamRecorder.createVirtualPageLoad(path);
		}
	});

}]);