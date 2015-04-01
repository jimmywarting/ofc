(function(a){function f(b,c){var d=a.createEvent("Event");d.initEvent(b,!0,!1);c.dispatchEvent(d)}function g(d){a[c.enabled]=a[b.enabled];a[c.element]=a[b.element];f(c.events.change,d.target)}function h(a){f(c.events.error,a.target)}var b,e,d={w3:{enabled:"fullscreenEnabled",element:"fullscreenElement",request:"requestFullscreen",exit:"exitFullscreen",events:{change:"fullscreenchange",error:"fullscreenerror"}},webkit:{enabled:"webkitIsFullScreen",element:"webkitCurrentFullScreenElement",request:"webkitRequestFullScreen",exit:"webkitCancelFullScreen",events:{change:"webkitfullscreenchange",error:"webkitfullscreenerror"}},moz:{enabled:"mozFullScreen",element:"mozFullScreenElement",request:"mozRequestFullScreen",exit:"mozCancelFullScreen",events:{change:"mozfullscreenchange",error:"mozfullscreenerror"}},ms:{enabled:"msFullscreenEnabled",element:"msFullscreenElement",request:"msRequestFullscreen",exit:"msExitFullscreen",events:{change:"MSFullscreenChange",error:"MSFullscreenError"}}},c=d.w3;for(e in d)if(d[e].enabled in a){b=d[e];break}c.enabled in a||!b||(a.addEventListener(b.events.change,g,!1),a.addEventListener(b.events.error,h,!1),a[c.enabled]=a[b.enabled],a[c.element]=a[b.element],a[c.exit]=a[b.exit],Element.prototype[c.request]=function(){return this[b.request].apply(this,arguments)});return b})(document);

!function(){

angular.module("aFilePicker", [])

.service("aFilePicker", ["$q", function($q) {

	var onlyPostMsgString = !function(a){try{postMessage({toString:function(){a=1}},"*")}catch(e){}return!a}(),
		// origin = "https://afilepicker.eu01.aws.af.cm",
		// origin = "https://app.afilepicker.com",
		origin = "https://afilepicker.github.io",
		win = window,
		doc = document,
		usingMsgChannel = !!win.MessageChannel,
		defered,
		emit,
		aFilePicker,
		aFileDialog;

	function el(tagName, attr, parent) {
		var el = doc.createElement(tagName);
		angular.extend(el, attr);
		parent.appendChild(el);
		return el;
	}

	function className(el,name){
		el.className = name || "";
	}

	function preventDefault(event) {
		event.preventDefault();
	}

	function keydown(event, key) {
		// TODO: can we move focus to the iframe and prevent everything
		// still want to be able to use cmd+l or ctrl+l win+d
		key = event.keyCode;
		key > 36 && key < 41 && preventDefault(event);
	}

	function disable_scroll() {
		// angular.element(document.documentElement).addClass('disable-scroll')
		angular.element([win, doc]).on('DOMMouseScroll, mousewheel, touchstart', preventDefault);
		angular.element(doc).on('keydown', keydown);
		window.onmousewheel = document.onmousewheel = preventDefault;
	}

	function enable_scroll() {
		angular.element([win, doc]).off('DOMMouseScroll, mousewheel, touchstart', preventDefault);
		angular.element(doc).off('keydown', keydown);
	    window.onmousewheel = document.onmousewheel = null;
	}

	// window.Source = Source;

	var hash = {}, curr, len, arr, id=0, blobClonable = false;

	function nextUID(){
		return id++;
	}

	function messageHandler(event) {
		if(typeof event.data.eventName === 'number'){
			hash[event.data.eventName](event.data.detail);
			delete hash[event.data.eventName];
			return
		}

		if(event.data.eventName == "aFilePicker::close") {

			if(event.data.status == 200 || event.data.status == 204){
				enable_scroll();
				try{
					aFilePicker.close();
				} catch(e){
					aFilePicker.removeAttribute('open');
				}

				function Read(id){
					this.id = id;
				};

				Read.prototype.emit = emit;

				Read.prototype.start = function(readAs, range, cb) {
					var callbackId = nextUID();
					hash[callbackId] = cb;

					this.emit({
						detail: {
							id: this.id,
							range: range || "0-",
							readAs: readAs || "Blob",
							onload: callbackId
						},
						eventName: "aFilePicker::FileReader"
					});
				};

				var sources = (event.data.detail || []).map(function(source){
					source.getFile = (new Read(source.id));
					delete source.id;
					return source;
				});

				defered.resolve(sources);
			}

		};

	}

	function createChannel(){
		return channel;
	};

	function instace(option){
		delete option.progress;

		var message = {
			detail: option,
			eventName: "aFilePicker::init",
			version: "v1"
		}

		// Try using MessageChannel first of all
		if(win.MessageChannel){
			var mc = new MessageChannel();

	    	// initialize the picker option
	    	aFileDialog.contentWindow.postMessage(message, origin, [mc.port2]);

			// Set up our port event listener.
			mc.port1.onmessage = messageHandler;

			// Open the port
			mc.port1.start();

			emit = function (msg) {
				msg.version = "v1";
				mc.port1.postMessage(msg);
			}
		} else {
			var channel = "aFilePicker_" + (+new Date);
	    	// initialize the picker option

	    	emit = function (msg) {
	    		msg.version = "v1";
	    		msg.channel = channel;
	    		
			if( !blobClonable && msg.detail && msg.detail.readAs === "Blob" ) {
				msg.detail.readAs = "ArrayBuffer";
				var orig = hash[msg.detail.onload];

				hash[msg.detail.onload] = function (buffer) {
					orig( new Blob([buffer]) );
				}
			}

			aFileDialog.contentWindow.postMessage(msg, origin);
			
		}

	    	emit(message);

			// Set up our event listener.
			window.addEventListener('message', function(event) {
				if(event.origin = origin && event.data.channel == message.channel){
					messageHandler(event);
				}
			});
		}

		// Show the filepicker dialog
		try{
			aFilePicker.showModal();
		} catch(e){
			aFilePicker.setAttribute('open', '');
		}
	}
	var iframeLoaded = $q.defer();

	aFileDialog = el("iframe", {
		id: "aFileDialog",
		src: origin + "#/my-device",
		// allowTransparency: true,
		onload: function(){
			try {
				this.contentWindow.postMessage(new blob([]));
				blobClonable = true;
			} catch (e) {
				// blobClonable = false;
			}
			iframeLoaded.resolve();			
		}
	}, aFilePicker = el("dialog", {
		id: "aFilePicker"
	}, document.body));

	function open(option) {
		defered = $q.defer();

		iframeLoaded.promise.then(function(){
			instace(option);

			(screen.width < 800 || screen.height < 500) && aFileDialog.requestFullscreen();

			disable_scroll();
		});

		return defered.promise;

	}

	return {
		pick: open,
		save: function(option) {
			option.saveMode = true;
			open(option);
		}
	};
}])

.directive("aFilePicker", ["aFilePicker", function(aFilePicker) {
	return {
		restrict: "A",
		require: '^ngModel',
		link: function($scope, $element, $attr, $ctrl) {

			$element.on('click', function(){
				aFilePicker.pick($scope.$eval($attr.aFilePicker) || {}).then(function(files) {
					$ctrl.$setViewValue(files);
					$ctrl.$render();
				});
			});

		}
	}
}]);

}();
