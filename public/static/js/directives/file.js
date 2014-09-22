/* global app, angular */

function validateFileType (filename, acceptedExt) {
	return filename.toLocaleLowerCase().endsWith(acceptedExt);
}

function validateMimeType (type, acceptedMime) {
	type = type.split("/"),
	acceptedMime = acceptedMime.split("/");

	return type[0] === acceptedMime[0] && (acceptedMime[1] === '*' || acceptedMime[1] === type[1]);
}

function processDragOverOrEnter(event) {
	event.stopPropagation();
	event.preventDefault();
}

function vaildate(scope, files, attr, ngModel) {

	var
	viewValue = [],
	multiple = "directory" in attr || "multiple" in attr,
	isValid = true,
	j,
	accepted,
	accepts,
	i = files.length;

	/*
	if (attr.accept) {

		accepts = attr.accept.split(',');

		while(isValid && i--) {

			j = accepts.length;
			isValid = false;

			while(!isValid && j--){
				accepted = accepts[j].trim();

				isValid = accepted.startsWith(".") ?
				validateFileType( files[i].name, accepted ):
				validateMimeType( files[i].type, accepted );
			}
		}
	}
	*/

	if (attr.accept) {

		accepts = attr.accept.split(',');

		while(isValid && i--) {

			j = accepts.length;
			isValid = false;

			while(!isValid && j--){
				accepted = accepts[j].trim();
				isValid = accepted.startsWith(".") ?
					validateFileType( files[i].name, accepted ):
					validateMimeType( files[i].type, accepted );

			}
		}

	}

	ngModel.$setValidity('file', isValid);

	if (isValid) {
		viewValue = multiple ? Array.prototype.slice.call(files) : files[0];
	} else if( multiple ) {
		viewValue = [];
	}

	if("dndAdd" in attr) {
		// viewValue.push.apply(viewValue, ngModel.$viewValue);
	}

	ngModel.$setViewValue(viewValue);

}

app.directive('wisFile', ["$sniffer", "$parse", function($sniffer, $parse) {
	return {
		restrict: 'A',
		require: "?ngModel",
		link: function(scope, element, attr, ngModel) {
			
			var directory = $sniffer && $sniffer.vendorPrefix.toLocaleLowerCase() + "directory";
			var isFileInput = element[0].matchesSelector("input[type=file]");
			if (!ngModel) return;
			

			// Make directory vendor prefix free in input[type="file"]
			if(isFileInput && "directory" in attr && !attr.directory && directory in element[0]){
				var model = $parse(attr.supported);
				model.assign(scope, directory in element[0]);

				element[0][directory] = true;
			}

			// Revalidates the model value if it would programmatlicly change
			ngModel.$render = function() {
				// TODO: its not a problem atm, b/c we are not changeing it programmatlicly
				// But this is the place if we would have to fix it... but how???

				// ngModel.$viewValue &&
				// ngModel.$viewValue.length &&
				// vaildate( scope, ngModel.$viewValue, attr, ngModel, true );

				// element.triggerHandler("change");
			};

			// var fn = $parse(attr['ngChange']);

			element.bind('dragover dragenter', processDragOverOrEnter);
			element.bind('drop change', function(event) {
				var files = (event.dataTransfer || event.target).files;

				// Just want to prevent default on drop event...
				event.preventDefault();
				scope.$apply(function() {
					vaildate(scope, files, attr, ngModel);
				});

			});

		}
	}
}]);