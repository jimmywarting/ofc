/* global app, query, Notification, fontStore, saveAs, saveState */
/* jshint boss:true */

app.controller("ConvertFontCtrl", ['$scope', '$location', function($scope, $location) {

	var activeFont, audio, acceptedFormats = app.sharedProperties.fontFormats;
	var supportSaving = ("download" in document.createElement("a")) || !!navigator.msSaveOrOpenBlob;

	function not (ext) {
		return function (item) {
			return item !== ext;
		};
	}

	saveAs = supportSaving ? saveAs : function(blob, filename){
		var reader = new FileReader();
		reader.onload = function(event){
			angular.element("<form action=/downloadify method=post><input value="+filename+" name=filename><input name=base64 value="+event.target.result.split(",")[1]+">")[0].submit();
		};
		reader.readAsDataURL(blob);
	}

	function watcher() {
		return $location.search().id;
	}

	function canConvertTo(){
		var done = activeFont.$inProgress.map(function(item){
			return item.extension;
		}).concat(activeFont.converted);

		return acceptedFormats.filter(function(item){
			return done.indexOf(item) == -1;
		});
	}

	function init (id) {
		activeFont = app.sharedProperties.fileList[id];

		$scope.deleted = !activeFont;
		if(!activeFont) return;

		activeFont.converted = activeFont.converted || [];
		activeFont.$inProgress = activeFont.$inProgress || [];
		activeFont.$notConverted = activeFont.$notConverted || canConvertTo();

		$scope.active = activeFont;
	}

	$scope.$watch(watcher, init);

	$scope.notify = !!localStorage.notify;
	$scope.sound  = !!localStorage.sound;

	if($scope.supportSound = !!window.Audio){
		audio = query("#audio_new")[0];

		$scope.toggleSound = function() {
			$scope.sound = !$scope.sound;
			if($scope.sound){
				audio.play();
				localStorage.sound = 1;
			} else {
				localStorage.removeItem("sound");
			}
		};

	}

	if($scope.supportNotify = !!window.Notification){
		$scope.toggleNotify = function() {
			var notification,
				close = function() {
					notification.close();
				};

			$scope.notify = !$scope.notify;

			if(!$scope.notify){
				localStorage.removeItem("notify");
			}

			if (Notification.permission !== 'denied' && $scope.notify) {
				Notification.requestPermission(function (permission) {

					localStorage.notify = 1;

					if(!('permission' in Notification)) {
						Notification.permission = permission;
					}

					if (permission === "granted" && $scope.notify) {
						notification = new Notification("Notification are enabled!", {
							icon: "/apple-touch-icon-57x57.png"
						});

						notification.onclick = close;
						setTimeout(close, 3500);
					}

				});
			}
		};
	}

	$scope.convert = function(ext) {
		var obj = {
			extension: ext,
			uploaded: 0,
			downloaded: 0,
			doing: "uploading",
			active: activeFont,
			id: $location.search().id
		};

		activeFont.$inProgress.push(obj);

		activeFont.$notConverted = activeFont.$notConverted.filter(not(ext));

		function saveFontLocal() {
			var blob = new Blob([this.response]);
			var notification;
			var index = obj.active.$inProgress.indexOf(obj);

			obj.active.$inProgress.splice(index, 1);

			obj.active.converted.push(ext);
			window.font = {
				id: obj.id+ext,
				blob: blob
			};
			window.fontStore.addFont({
				id: obj.id+ext,
				blob: blob
			});

			saveState();

			$scope.sound && audio.play();

			if($scope.notify){
				notification = new Notification(activeFont.name, {
					icon: "/img/favicon/apple-touch-icon-57x57.png",
					body: "Has converted to " + ext + "\nClick here to download"
				});

				notification.onclick = function(){
					saveAs(blob, obj.active.name + "." + ext + ".tar.gz");
				};
			}

			$scope.$apply();
		}

		fontStore.getFonts(obj.id+'default', function(blob){
			var fd = new FormData();
			fd.append("file", blob, obj.active.name);
			fd.append("format", ext);

			var xhr = new XMLHttpRequest();
			xhr.addEventListener("progress", progress, false);
			xhr.addEventListener("load", saveFontLocal, false);
			xhr.upload.addEventListener("progress", progress, false);
			xhr.open("POST", "https://ofc.p.mashape.com/directConvert/");
			xhr.responseType = "arraybuffer";
			xhr.onreadystatechange = stateChange;
			xhr.setRequestHeader('X-Mashape-Authorization', 'dFYPWXxpp3mshKD6Kimb4pVfvYLvp1YWcWfjsnErOY3HN8zs4a');
			xhr.send(fd);

			_gaq.push(['_trackEvent', 'font', 'upload', obj.active.name]);
			_gaq.push(['_trackEvent', 'font', obj.active.name.split(".").pop()+'-to-'+ext, obj.active.name]);

			function stateChange() {

				switch (xhr.readyState) {
					case 2: obj.doing = "converting"; obj.uploaded = 1; break;
					case 3: obj.doing = "downloading"; break;
				}
				$scope.$apply();

			}

			function progress(event){
				if(event.lengthComputable){
					obj[event.target === xhr ? "downloaded" : "uploaded"] = event.loaded / event.total;
					$scope.$apply();
				}
			}

		});
	};



	$scope.download = function(ext){
		fontStore.getFonts($location.search().id + ext, function(blob){
			_gaq.push(['_trackEvent', 'font', 'save-'+ext, activeFont.name]);
			saveAs(blob, activeFont.name + (ext === 'default' ? "" : "."+ext+".tar.gz"));
		});
	};

}]);