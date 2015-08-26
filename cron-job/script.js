var app = angular.module('StarterApp', ['ngMaterial']);

app.controller('AppCtrl', ['$mdSidenav', function($mdSidenav) {

	this.pushEnabeld = false;
	this.pushChanged = function() {
		if(this.pushEnabeld){
			subscribe();
		} else {
			unsubscribe();
		}
	};

	function subscribe(){}

	function subscribe() {
		// Let's check if the user is okay to get some notification
		if (Notification.permission === "granted") {
			// If it's okay let's create a cron job
			navigator.serviceWorker.register('https://onlinefontconverter.com/cron-job/service-worker.js');
		}

		// Otherwise, we need to ask the user for permission
		// Note, Chrome does not implement the permission static property
		// So we have to check for NOT 'denied' instead of 'default'
		else if (Notification.permission !== 'denied') {
			Notification.requestPermission(function(permission) {

				// Whatever the user answers, we make sure we store the information
				if (!('permission' in Notification)) {
					Notification.permission = permission;
				}

				// If it's okay let's create a cron job
				if (permission === "granted") {
					navigator.serviceWorker.register('https://onlinefontconverter.com/cron-job/service-worker.js');
				}
			});
		}

		// At last, if the user already denied any notification, and you 
		// want to be respectful there is no need to bother him any more.
	}
}]);
