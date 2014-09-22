/* global angular */

document.documentElement.className = 'js';

if (!String.prototype.startsWith) {
	Object.defineProperty(String.prototype, 'startsWith', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (searchString, position) {
			position = position || 0;
			return this.indexOf(searchString, position) === position;
		}
	});
}

if (!String.prototype.endsWith) {
	Object.defineProperty(String.prototype, 'endsWith', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (searchString, position) {
			position = position || this.length;
			position = position - searchString.length;
			var lastIndex = this.lastIndexOf(searchString);
			return lastIndex !== -1 && lastIndex === position;
		}
	});
}

window.Element && function(ElementPrototype) {
	ElementPrototype.matchesSelector = ElementPrototype.matchesSelector || 
	ElementPrototype.mozMatchesSelector ||
	ElementPrototype.msMatchesSelector ||
	ElementPrototype.oMatchesSelector ||
	ElementPrototype.webkitMatchesSelector ||
	function (selector) {
		var node = this, nodes = (node.parentNode || node.document).querySelectorAll(selector), i = -1;
 
		while (nodes[++i] && nodes[i] != node);
 
		return !!nodes[i];
	}
}(Element.prototype);


var app = angular.module("app", ['xc.indexedDB']),

	// Simply query selector
	query = function(selector){
		return angular.element(document.querySelectorAll(selector));
	},
	uuid = (function(){
		var addedFiles = +(localStorage.addedFiles || 0);

		return function (){
			addedFiles++;
			return localStorage.addedFiles = addedFiles;
		};
	}()),
	saveState = function() {
		var localFileList = app.sharedProperties.fileList;
		localStorage.fileList = angular.toJson(localFileList);
	};

app.sharedProperties = {
	fileList: angular.fromJson(localStorage.fileList || "{}"),
	fontFormats: "afm bin cff dfont eot otf pfa pfb pfm ps pt3 suit svg t42 tfm ttc ttf woff".split(" ")
};

global.app = app;


window.onerror = function(message, url, linenumber) {

	if (window.XMLHttpRequest) {
		var xhr = new XMLHttpRequest();
		var fd = new FormData();
		var scripturl = "/log";
		var log = Array.prototype.slice.call(arguments, 0).join(', ');
		fd.append("log", log);
		xhr.open("POST", scripturl);
		xhr.send(fd);
	}
	return true;
	
}
