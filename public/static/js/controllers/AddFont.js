/* global app, angular, fontStore, uuid, saveState, query */

app.controller("AddFont", ['$scope', '$rootScope','db', '$location', function ($scope, $rootScope, db, $location) {
	
	$rootScope.acceptedFiles = ".pdf,." + app.sharedProperties.fontFormats.join(",.");

	$scope.files = app.sharedProperties.fileList;
	$scope.deleteFont = function(id) {
		var filelist = app.sharedProperties.fileList;
		angular.forEach(filelist[id].converted, function(extensions) {
			fontStore.remove(id+extensions);
		});

		window.fontStore.remove(id+"default");
		delete filelist[id];
		saveState();

		$location.search().id == id && $location.url("/");

	};


	$rootScope.onFileSelect = function() {
		var lastId;
		angular.forEach($rootScope.files, function(file) {
			var id = "p" + uuid();
			
			var font = {
				blob: file,
				id: id + "default"
			};

			lastId = id;

			app.sharedProperties.fileList[id] = {
				name: file.name,
				size: file.size
			};

			saveState();
			window.fontStore.addFont(font);


		});

		lastId && $location.path('/font').search({id:lastId});

	};

	query("html").bind('dragenter', function() {
		query("html").addClass('hover');
	});

	query("#dropzone").bind("dragleave dragexit drop", function() {
		query("html").removeClass('hover');
	});

}]);