/* global app, db */

;(function() {

	var hasArrayBufferViewSupport = (function () {
		try {
			return new Blob([new Uint8Array(100)]).size === 100;
		} catch (e) {
			return false;
		}
	}())

	function encode(file, callback) {
		var promis = {};
		var reader = new FileReader();
		reader.onload = function(){
			file.blob = reader.result;
			callback(file);
		};

		reader.readAsBinaryString(file.blob);
		return promis;
	}

	function binaryToBlob(byteString, mime) {
		var arrayBuffer,
		intArray,
		i;

		// Write the bytes of the string to an ArrayBuffer:
		arrayBuffer = new ArrayBuffer(byteString.length);
		intArray = new Uint8Array(arrayBuffer);
		for (i = 0; i < byteString.length; i += 1) {
			intArray[i] = byteString.charCodeAt(i);
		}
		return new Blob(
			[hasArrayBufferViewSupport ? intArray : arrayBuffer],
			{type: mime || "application/octet-stream"}
		);
	};

	app.service('db', ['$indexedDB', '$q', function($indexedDB, $q){
		function encode(file, callback) {
			var defered = $q.defer();
			var reader = new FileReader();
			reader.onload = function(){
				file.blob = reader.result;
				defered.resolve(file);
			};
			reader.readAsBinaryString(file.blob);
			return defered.promise;
		}

		var IDBBlobSupport = false;

		var OBJECT_STORE_NAME = 'fontStore';

		var myObjectStore = $indexedDB.objectStore(OBJECT_STORE_NAME);

		// TODO: relly ugly hack to make indexeddb work, FIX!
		window.shimIndexedDB && !localStorage.cached && (localStorage.cached = 1, window.location.reload());

		myObjectStore.insert({id:"key", blob:"new Blob"}).then(function(a) {
			myObjectStore.delete("key");
			IDBBlobSupport = false;
		}, function(error) {});

		window.e=myObjectStore;

		var service = {
			getFonts: function(id, callback) {
				myObjectStore.find(id).then(function(font) {
					font.blob = IDBBlobSupport ? font.blob : binaryToBlob(font.blob);
					callback(font.blob);
				});
			},

			addFont: function(file){
				IDBBlobSupport ? myObjectStore.insert(file) : encode(file).then(function(file){
					myObjectStore.insert(file);
				});
			},

			remove: function(id) {
				myObjectStore.delete(id);
			}
		};
		window.fontStore = service;
/*
		*/

		
		
		return {};

	}]);

})();