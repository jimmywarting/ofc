/* global app */

app.filter('filesize', function(){
	return function(size){
		// GB
		if (size > 1073741824) {
			return Math.round(size / 1073741824, 1) + " GB";
		}

		// MB
		if (size > 1048576) {
			return Math.round(size / 1048576, 1) + " MB";
		}

		// KB
		if (size > 1024) {
			return Math.round(size / 1024, 1) + " KB";
		}

		return size + " b";
	};
});