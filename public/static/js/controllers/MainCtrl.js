/* global app, google_ad_block */

app.controller("MainCtrl", function($rootScope) {
	
	$rootScope.files = [];
	var oAppCache = window.applicationCache;

	if(window.google_ad_block === undefined){
		this.block = "blocked";
	}

	this.supportCache = false;

	if(oAppCache){
		this.supportCache = true;
		this.toggleCacheText = oAppCache.status === oAppCache.UNCACHED ? "Enable offline support" : "Offline support enabled";
		/*
		switch ( oAppCache.status ) {
			case oAppCache.UNCACHED    : sCacheStatus = "Not cached"; break;
			case oAppCache.IDLE        : sCacheStatus = "Idle"; break;
			case oAppCache.CHECKING    : sCacheStatus = "Checking"; break;
			case oAppCache.DOWNLOADING : sCacheStatus = "Downloading"; break;
			case oAppCache.UPDATEREADY : sCacheStatus = "Update ready"; break;
			case oAppCache.OBSOLETE    : sCacheStatus = "Obsolete"; break;
			default                    : sCacheStatus = "Unexpected Status ( " + oAppCache.status.toString() + ")"; break;
		}

		console.log(sCacheStatus);
		*/
	}

	this.enableCache = function() {
		var expires = +new Date() + 31536000000; // one year

		document.cookie = "ofc-offline=npm_package_version; expires=" + expires + "; path=/";

		window.location.reload(true);
	};

});

app.controller("RouteCtrl", ["$scope", "$location", function($scope, $location) {

	var root = "/npm_package_version/html";
	var link = document.createElement("a");

	$scope.$watch(function(){ return $location.path(); }, function(newPath) {
		if(!DEBUG){
			window._gaq.push(['_trackPageview', newPath]);
			((window.sessionCamRecorder || {}).createVirtualPageLoad) && window.sessionCamRecorder.createVirtualPageLoad(newPath);
		};

		link.href = root + (newPath == "/" ? "/start" : newPath);

		$scope.page = link.pathname;
	});

}]);