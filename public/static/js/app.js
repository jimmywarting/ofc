!function(exports, global) {
    /**
 * @license $indexedDBProvider
 * (c) 2013 Clemens Capitain (webcss)
 * License: MIT
 */
    "use strict";
    /* global app, angular */
    function validateFileType(filename, acceptedExt) {
        return filename.toLocaleLowerCase().endsWith(acceptedExt);
    }
    function validateMimeType(type, acceptedMime) {
        return type = type.split("/"), acceptedMime = acceptedMime.split("/"), type[0] === acceptedMime[0] && ("*" === acceptedMime[1] || acceptedMime[1] === type[1]);
    }
    function processDragOverOrEnter(event) {
        event.stopPropagation(), event.preventDefault();
    }
    function vaildate(scope, files, attr, ngModel) {
        var j, accepted, accepts, viewValue = [], multiple = "directory" in attr || "multiple" in attr, isValid = !0, i = files.length;
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
        if (attr.accept) for (accepts = attr.accept.split(","); isValid && i--; ) for (j = accepts.length, 
        isValid = !1; !isValid && j--; ) accepted = accepts[j].trim(), isValid = accepted.startsWith(".") ? validateFileType(files[i].name, accepted) : validateMimeType(files[i].type, accepted);
        ngModel.$setValidity("file", isValid), isValid ? viewValue = multiple ? Array.prototype.slice.call(files) : files[0] : multiple && (viewValue = []), 
        ngModel.$setViewValue(viewValue);
    }
    global.app = exports, /* global angular */
    document.documentElement.className = "js", String.prototype.startsWith || Object.defineProperty(String.prototype, "startsWith", {
        enumerable: !1,
        configurable: !1,
        writable: !1,
        value: function(searchString, position) {
            return position = position || 0, this.indexOf(searchString, position) === position;
        }
    }), String.prototype.endsWith || Object.defineProperty(String.prototype, "endsWith", {
        enumerable: !1,
        configurable: !1,
        writable: !1,
        value: function(searchString, position) {
            position = position || this.length, position -= searchString.length;
            var lastIndex = this.lastIndexOf(searchString);
            return -1 !== lastIndex && lastIndex === position;
        }
    }), window.Element && function(ElementPrototype) {
        ElementPrototype.matchesSelector = ElementPrototype.matchesSelector || ElementPrototype.mozMatchesSelector || ElementPrototype.msMatchesSelector || ElementPrototype.oMatchesSelector || ElementPrototype.webkitMatchesSelector || function(selector) {
            for (var node = this, nodes = (node.parentNode || node.document).querySelectorAll(selector), i = -1; nodes[++i] && nodes[i] != node; ) ;
            return !!nodes[i];
        };
    }(Element.prototype);
    var app = angular.module("app", [ "xc.indexedDB" ]), // Simply query selector
    query = function(selector) {
        return angular.element(document.querySelectorAll(selector));
    }, uuid = function() {
        var addedFiles = +(localStorage.addedFiles || 0);
        return function() {
            return addedFiles++, localStorage.addedFiles = addedFiles;
        };
    }(), saveState = function() {
        var localFileList = app.sharedProperties.fileList;
        localStorage.fileList = angular.toJson(localFileList);
    };
    app.sharedProperties = {
        fileList: angular.fromJson(localStorage.fileList || "{}"),
        fontFormats: "afm bin cff dfont eot otf pfa pfb pfm ps pt3 suit svg t42 tfm ttc ttf woff".split(" ")
    }, global.app = app, window.onerror = function() {
        if (window.XMLHttpRequest) {
            var xhr = new XMLHttpRequest(), fd = new FormData(), scripturl = "/log", log = Array.prototype.slice.call(arguments, 0).join(", ");
            fd.append("log", log), xhr.open("POST", scripturl), xhr.send(fd);
        }
        return !0;
    }, /* global app */
    app.config([ "$locationProvider", "$httpProvider", "$indexedDBProvider", function($locationProvider, $httpProvider, $indexedDBProvider) {
        $locationProvider.html5Mode(!0);
        var $http, interceptor = [ "$q", "$injector", function($q, $injector) {
            function success(response) {
                return response;
            }
            function error(response) {
                if (404 === response.status && response.config.url.indexOf("html")) {
                    $http = $http || $injector.get("$http");
                    var defer = $q.defer();
                    return $http.get("/0.1.5/html/404").then(function(result) {
                        response.status = 200, response.data = result.data, defer.resolve(response);
                    }, function() {
                        defer.reject(response);
                    }), defer.promise;
                }
                return $q.reject(response);
            }
            return function(promise) {
                return promise.then(success, error);
            };
        } ];
        $httpProvider.responseInterceptors.push(interceptor), $indexedDBProvider.connection("onlinefontconverter").upgradeDatabase(3, function(event, db) {
            db.createObjectStore("fontStore", {
                keyPath: "id"
            });
        });
    } ]), /* global app, angular, fontStore, uuid, saveState, query */
    app.controller("AddFont", [ "$scope", "$rootScope", "db", "$location", function($scope, $rootScope, db, $location) {
        $rootScope.acceptedFiles = ".pdf,." + app.sharedProperties.fontFormats.join(",."), 
        $scope.files = app.sharedProperties.fileList, $scope.deleteFont = function(id) {
            var filelist = app.sharedProperties.fileList;
            angular.forEach(filelist[id].converted, function(extensions) {
                fontStore.remove(id + extensions);
            }), window.fontStore.remove(id + "default"), delete filelist[id], saveState(), $location.search().id == id && $location.url("/");
        }, $rootScope.onFileSelect = function() {
            var lastId;
            angular.forEach($rootScope.files, function(file) {
                var id = "p" + uuid(), font = {
                    blob: file,
                    id: id + "default"
                };
                lastId = id, app.sharedProperties.fileList[id] = {
                    name: file.name,
                    size: file.size
                }, saveState(), window.fontStore.addFont(font);
            }), lastId && $location.path("/font").search({
                id: lastId
            });
        }, query("html").bind("dragenter", function() {
            query("html").addClass("hover");
        }), query("#dropzone").bind("dragleave dragexit drop", function() {
            query("html").removeClass("hover");
        });
    } ]), /* global app, query, Notification, fontStore, saveAs, saveState */
    /* jshint boss:true */
    app.controller("ConvertFontCtrl", [ "$scope", "$location", function($scope, $location) {
        function not(ext) {
            return function(item) {
                return item !== ext;
            };
        }
        function watcher() {
            return $location.search().id;
        }
        function canConvertTo() {
            var done = activeFont.$inProgress.map(function(item) {
                return item.extension;
            }).concat(activeFont.converted);
            return acceptedFormats.filter(function(item) {
                return -1 == done.indexOf(item);
            });
        }
        function init(id) {
            activeFont = app.sharedProperties.fileList[id], $scope.deleted = !activeFont, activeFont && (activeFont.converted = activeFont.converted || [], 
            activeFont.$inProgress = activeFont.$inProgress || [], activeFont.$notConverted = activeFont.$notConverted || canConvertTo(), 
            $scope.active = activeFont);
        }
        var activeFont, audio, acceptedFormats = app.sharedProperties.fontFormats, supportSaving = "download" in document.createElement("a") || !!navigator.msSaveOrOpenBlob;
        saveAs = supportSaving ? saveAs : function(blob, filename) {
            var reader = new FileReader();
            reader.onload = function(event) {
                angular.element("<form action=/downloadify method=post><input value=" + filename + " name=filename><input name=base64 value=" + event.target.result.split(",")[1] + ">")[0].submit();
            }, reader.readAsDataURL(blob);
        }, $scope.$watch(watcher, init), $scope.notify = !!localStorage.notify, $scope.sound = !!localStorage.sound, 
        ($scope.supportSound = !!window.Audio) && (audio = query("#audio_new")[0], $scope.toggleSound = function() {
            $scope.sound = !$scope.sound, $scope.sound ? (audio.play(), localStorage.sound = 1) : localStorage.removeItem("sound");
        }), ($scope.supportNotify = !!window.Notification) && ($scope.toggleNotify = function() {
            var notification, close = function() {
                notification.close();
            };
            $scope.notify = !$scope.notify, $scope.notify || localStorage.removeItem("notify"), 
            "denied" !== Notification.permission && $scope.notify && Notification.requestPermission(function(permission) {
                localStorage.notify = 1, "permission" in Notification || (Notification.permission = permission), 
                "granted" === permission && $scope.notify && (notification = new Notification("Notification are enabled!", {
                    icon: "/apple-touch-icon-57x57.png"
                }), notification.onclick = close, setTimeout(close, 3500));
            });
        }), $scope.convert = function(ext) {
            function saveFontLocal() {
                var notification, blob = new Blob([ this.response ]), index = obj.active.$inProgress.indexOf(obj);
                obj.active.$inProgress.splice(index, 1), obj.active.converted.push(ext), window.font = {
                    id: obj.id + ext,
                    blob: blob
                }, window.fontStore.addFont({
                    id: obj.id + ext,
                    blob: blob
                }), saveState(), $scope.sound && audio.play(), $scope.notify && (notification = new Notification(activeFont.name, {
                    icon: "/img/favicon/apple-touch-icon-57x57.png",
                    body: "Has converted to " + ext + "\nClick here to download"
                }), notification.onclick = function() {
                    saveAs(blob, obj.active.name + "." + ext + ".tar.gz");
                }), $scope.$apply();
            }
            var obj = {
                extension: ext,
                uploaded: 0,
                downloaded: 0,
                doing: "uploading",
                active: activeFont,
                id: $location.search().id
            };
            activeFont.$inProgress.push(obj), activeFont.$notConverted = activeFont.$notConverted.filter(not(ext)), 
            fontStore.getFonts(obj.id + "default", function(blob) {
                function stateChange() {
                    switch (xhr.readyState) {
                      case 2:
                        obj.doing = "converting", obj.uploaded = 1;
                        break;

                      case 3:
                        obj.doing = "downloading";
                    }
                    $scope.$apply();
                }
                function progress(event) {
                    event.lengthComputable && (obj[event.target === xhr ? "downloaded" : "uploaded"] = event.loaded / event.total, 
                    $scope.$apply());
                }
                var fd = new FormData();
                fd.append("file", blob, obj.active.name), fd.append("format", ext);
                var xhr = new XMLHttpRequest();
                xhr.addEventListener("progress", progress, !1), xhr.addEventListener("load", saveFontLocal, !1), 
                xhr.upload.addEventListener("progress", progress, !1), xhr.open("POST", "https://ofc.p.mashape.com/directConvert/"), 
                xhr.responseType = "arraybuffer", xhr.onreadystatechange = stateChange, xhr.setRequestHeader("X-Mashape-Authorization", "dFYPWXxpp3mshKD6Kimb4pVfvYLvp1YWcWfjsnErOY3HN8zs4a"), 
                xhr.send(fd), _gaq.push([ "_trackEvent", "font", "upload", obj.active.name ]), _gaq.push([ "_trackEvent", "font", obj.active.name.split(".").pop() + "-to-" + ext, obj.active.name ]);
            });
        }, $scope.download = function(ext) {
            fontStore.getFonts($location.search().id + ext, function(blob) {
                _gaq.push([ "_trackEvent", "font", "save-" + ext, activeFont.name ]), saveAs(blob, activeFont.name + ("default" === ext ? "" : "." + ext + ".tar.gz"));
            });
        };
    } ]), /* global app, google_ad_block */
    app.controller("MainCtrl", function($rootScope) {
        $rootScope.files = [];
        var oAppCache = window.applicationCache;
        void 0 === window.google_ad_block && (this.block = "blocked"), this.supportCache = !1, 
        oAppCache && (this.supportCache = !0, this.toggleCacheText = oAppCache.status === oAppCache.UNCACHED ? "Enable offline support" : "Offline support enabled"), 
        this.enableCache = function() {
            var expires = +new Date() + 31536e6;
            // one year
            document.cookie = "ofc-offline=0.1.5; expires=" + expires + "; path=/", 
            window.location.reload(!0);
        };
    }), app.controller("RouteCtrl", [ "$scope", "$location", function($scope, $location) {
        var root = "/0.1.5/html", link = document.createElement("a");
        $scope.$watch(function() {
            return $location.path();
        }, function(newPath) {
            link.href = root + ("/" == newPath ? "/start" : newPath), $scope.page = link.pathname;
        });
    } ]), app.directive("wisFile", [ "$sniffer", "$parse", function($sniffer, $parse) {
        return {
            restrict: "A",
            require: "?ngModel",
            link: function(scope, element, attr, ngModel) {
                var directory = $sniffer && $sniffer.vendorPrefix.toLocaleLowerCase() + "directory", isFileInput = element[0].matchesSelector("input[type=file]");
                if (ngModel) {
                    // Make directory vendor prefix free in input[type="file"]
                    if (isFileInput && "directory" in attr && !attr.directory && directory in element[0]) {
                        var model = $parse(attr.supported);
                        model.assign(scope, directory in element[0]), element[0][directory] = !0;
                    }
                    // Revalidates the model value if it would programmatlicly change
                    ngModel.$render = function() {}, // var fn = $parse(attr['ngChange']);
                    element.bind("dragover dragenter", processDragOverOrEnter), element.bind("drop change", function(event) {
                        var files = (event.dataTransfer || event.target).files;
                        // Just want to prevent default on drop event...
                        event.preventDefault(), scope.$apply(function() {
                            vaildate(scope, files, attr, ngModel);
                        });
                    });
                }
            }
        };
    } ]), /* global app */
    app.filter("filesize", function() {
        return function(size) {
            // GB
            // GB
            // MB
            // KB
            return size > 1073741824 ? Math.round(size / 1073741824, 1) + " GB" : size > 1048576 ? Math.round(size / 1048576, 1) + " MB" : size > 1024 ? Math.round(size / 1024, 1) + " KB" : size + " b";
        };
    });
    /* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 2013-01-23
 *
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See LICENSE.md
 */
    /*global self */
    /*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */
    /*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
    var saveAs = saveAs || navigator.msSaveOrOpenBlob && navigator.msSaveOrOpenBlob.bind(navigator) || function(view) {
        var doc = view.document, get_URL = function() {
            return view.URL || view.webkitURL || view;
        }, URL = view.URL || view.webkitURL || view, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"), can_use_save_link = !view.externalHost && "download" in save_link, click = function(node) {
            var event = doc.createEvent("MouseEvents");
            event.initMouseEvent("click", !0, !1, view, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null), 
            node.dispatchEvent(event);
        }, webkit_req_fs = view.webkitRequestFileSystem, req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem, throw_outside = function(ex) {
            (view.setImmediate || view.setTimeout)(function() {
                throw ex;
            }, 0);
        }, force_saveable_type = "application/octet-stream", fs_min_size = 0, deletion_queue = [], process_deletion_queue = function() {
            for (var i = deletion_queue.length; i--; ) {
                var file = deletion_queue[i];
                "string" == typeof file ? // file is an object URL
                URL.revokeObjectURL(file) : // file is a File
                file.remove();
            }
            deletion_queue.length = 0;
        }, dispatch = function(filesaver, event_types, event) {
            event_types = [].concat(event_types);
            for (var i = event_types.length; i--; ) {
                var listener = filesaver["on" + event_types[i]];
                if ("function" == typeof listener) try {
                    listener.call(filesaver, event || filesaver);
                } catch (ex) {
                    throw_outside(ex);
                }
            }
        }, FileSaver = function(blob, name) {
            // First try a.download, then web filesystem, then object URLs
            var object_url, target_view, slice, filesaver = this, type = blob.type, blob_changed = !1, get_object_url = function() {
                var object_url = get_URL().createObjectURL(blob);
                return deletion_queue.push(object_url), object_url;
            }, dispatch_all = function() {
                dispatch(filesaver, "writestart progress write writeend".split(" "));
            }, fs_error = function() {
                // don't create more object URLs than needed
                (blob_changed || !object_url) && (object_url = get_object_url(blob)), target_view ? target_view.location.href = object_url : window.open(object_url, "_blank"), 
                filesaver.readyState = filesaver.DONE, dispatch_all();
            }, abortable = function(func) {
                return function() {
                    return filesaver.readyState !== filesaver.DONE ? func.apply(this, arguments) : void 0;
                };
            }, create_if_not_found = {
                create: !0,
                exclusive: !1
            };
            // Object and web filesystem URLs have a problem saving in Google Chrome when
            // viewed in a tab, so I force save with application/octet-stream
            // http://code.google.com/p/chromium/issues/detail?id=91158
            // Since I can't be sure that the guessed media type will trigger a download
            // in WebKit, I append .download to the filename.
            // https://bugs.webkit.org/show_bug.cgi?id=65440
            return filesaver.readyState = filesaver.INIT, name || (name = "download"), can_use_save_link ? (object_url = get_object_url(blob), 
            save_link.href = object_url, save_link.download = name, click(save_link), filesaver.readyState = filesaver.DONE, 
            void dispatch_all()) : (view.chrome && type && type !== force_saveable_type && (slice = blob.slice || blob.webkitSlice, 
            blob = slice.call(blob, 0, blob.size, force_saveable_type), blob_changed = !0), 
            webkit_req_fs && "download" !== name && (name += ".download"), (type === force_saveable_type || webkit_req_fs) && (target_view = view), 
            req_fs ? (fs_min_size += blob.size, void req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
                fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
                    var save = function() {
                        dir.getFile(name, create_if_not_found, abortable(function(file) {
                            file.createWriter(abortable(function(writer) {
                                writer.onwriteend = function(event) {
                                    target_view.location.href = file.toURL(), deletion_queue.push(file), filesaver.readyState = filesaver.DONE, 
                                    dispatch(filesaver, "writeend", event);
                                }, writer.onerror = function() {
                                    var error = writer.error;
                                    error.code !== error.ABORT_ERR && fs_error();
                                }, "writestart progress write abort".split(" ").forEach(function(event) {
                                    writer["on" + event] = filesaver["on" + event];
                                }), writer.write(blob), filesaver.abort = function() {
                                    writer.abort(), filesaver.readyState = filesaver.DONE;
                                }, filesaver.readyState = filesaver.WRITING;
                            }), fs_error);
                        }), fs_error);
                    };
                    dir.getFile(name, {
                        create: !1
                    }, abortable(function(file) {
                        // delete file if it already exists
                        file.remove(), save();
                    }), abortable(function(ex) {
                        ex.code === ex.NOT_FOUND_ERR ? save() : fs_error();
                    }));
                }), fs_error);
            }), fs_error)) : void fs_error());
        }, FS_proto = FileSaver.prototype, saveAs = function(blob, name) {
            return new FileSaver(blob, name);
        };
        return FS_proto.abort = function() {
            var filesaver = this;
            filesaver.readyState = filesaver.DONE, dispatch(filesaver, "abort");
        }, FS_proto.readyState = FS_proto.INIT = 0, FS_proto.WRITING = 1, FS_proto.DONE = 2, 
        FS_proto.error = FS_proto.onwritestart = FS_proto.onprogress = FS_proto.onwrite = FS_proto.onabort = FS_proto.onerror = FS_proto.onwriteend = null, 
        view.addEventListener("unload", process_deletion_queue, !1), saveAs;
    }(self);
    "undefined" != typeof module && (module.exports = saveAs);
    /** unify browser specific implementations */
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB, IDBKeyRange = window.IDBKeyRange || window.mozIDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    angular.module("xc.indexedDB", []).provider("$indexedDB", function() {
        var module = this, /** IDBTransaction mode constants */
        READONLY = "readonly", READWRITE = "readwrite", /** IDBCursor direction and skip behaviour constants */
        NEXT = "next", NEXTUNIQUE = "nextunique", PREV = "prev", PREVUNIQUE = "prevunique";
        /** predefined variables */
        module.dbName = "", module.dbVersion = 1, module.db = null, /** predefined callback functions, can be customized in angular.config */
        module.onTransactionComplete = function() {
            console.log("Transaction completed.");
        }, module.onTransactionAbort = function(e) {
            console.log("Transaction aborted: " + e.target.webkitErrorMessage || e.target.errorCode);
        }, module.onTransactionError = function(e) {
            console.log("Transaction failed: " + e.target.errorCode);
        }, module.onDatabaseError = function(e) {
            alert("Database error: " + e.target.webkitErrorMessage || e.target.errorCode);
        }, module.onDatabaseBlocked = function() {
            // If some other tab is loaded with the database, then it needs to be closed
            // before we can proceed.
            alert("Database is blocked. Try close other tabs with this page open and reload this page!");
        }, /**
     * @ngdoc function
     * @name $indexedDBProvider.connection
     * @function
     *
     * @description
     * sets the name of the database to use
     *
     * @param {string} databaseName database name.
     * @returns {object} this
     */
        module.connection = function(databaseName) {
            return module.dbName = databaseName, this;
        }, /**
     * @ngdoc function
     * @name $indexedDBProvider.upgradeDatabase
     * @function
     *
     * @description provides version number and steps to upgrade the database wrapped in a 
     * callback function
     *
     * @param {number} newVersion new version number for the database.
     * @param {function} callback the callback which proceeds the upgrade
     * @returns {object} this
     */
        module.upgradeDatabase = function(newVersion, callback) {
            if (newVersion && newVersion !== parseInt(newVersion)) throw "Database error: version needs to be a positive intenger";
            return module.dbVersion = newVersion, module.upgradeCallback = callback, this;
        }, module.$get = [ "$q", "$rootScope", function($q, $rootScope) {
            /** 
         * @ngdoc object
         * @name defaultQueryOptions
         * @function
         * 
         * @description optionally specify for cursor requests:
         * - which index to use
         * - a keyRange to apply
         * - the direction of traversal (bottom to top/top to bottom)
         */
            var defaultQueryOptions = {
                useIndex: void 0,
                keyRange: null,
                direction: NEXT
            }, dbPromise = function() {
                var dbReq, defered = $q.defer();
                return module.db ? defered.resolve(module.db) : (dbReq = indexedDB.open(module.dbName, module.dbVersion || 1), 
                dbReq.onsuccess = function() {
                    module.db = dbReq.result, $rootScope.$apply(function() {
                        defered.resolve(module.db);
                    });
                }, dbReq.onblocked = module.onDatabaseBlocked, dbReq.onerror = module.onDatabaseError, 
                dbReq.onupgradeneeded = function(e) {
                    var db = e.target.result, tx = e.target.transaction;
                    console.log('upgrading database "' + db.name + '" from version ' + e.oldVersion + " to version " + e.newVersion + "..."), 
                    module.upgradeCallback && module.upgradeCallback(e, db, tx);
                }), defered.promise;
            }, ObjectStore = function(storeName) {
                this.storeName = storeName, this.transaction = void 0;
            };
            ObjectStore.prototype = {
                /** 
             * @ngdoc method
             * @name ObjectStore.internalObjectStore 
             * @function
             * 
             * @description used internally to retrieve an objectstore
             * with the correct transaction mode
             * 
             * @params {string} storeName name of the objectstore
             * @params {string} mode transaction mode to use for operation
             * @returns {object} IDBObjectStore the objectstore in question
             */
                internalObjectStore: function(storeName, mode) {
                    var me = this;
                    return dbPromise().then(function(db) {
                        return me.transaction = db.transaction([ storeName ], mode || READONLY), me.transaction.oncomplete = module.onTransactionComplete, 
                        me.transaction.onabort = module.onTransactionAbort, me.onerror = module.onTransactionError, 
                        me.transaction.objectStore(storeName);
                    });
                },
                /** 
             * @ngdoc method
             * @name ObjectStore.abort 
             * @function
             * 
             * @description abort the current transaction
             */
                abort: function() {
                    this.transaction && this.transaction.abort();
                },
                /** 
             * @ngdoc method
             * @name ObjectStore.insert 
             * @function
             * 
             * @description wrapper for IDBObjectStore.add.
             * input data can be a single object or an array of objects for
             * bulk insertions within a single transaction
             * 
             * @params {object or array} data the data to insert
             * @returns {object} $q.promise a promise on successfull execution
             */
                insert: function(data) {
                    var d = $q.defer();
                    return this.internalObjectStore(this.storeName, READWRITE).then(function(store) {
                        var req, insert = function() {
                            try {
                                req = store.add(data), req.onsuccess = req.onerror = function(e) {
                                    $rootScope.$apply(function() {
                                        d.resolve(e.target.result);
                                    });
                                };
                            } catch (e) {
                                d.reject(e);
                            }
                        };
                        return angular.isArray(data) ? data.forEach(insert) : insert(data), d.promise;
                    });
                },
                /** 
             * @ngdoc method
             * @name ObjectStore.upsert 
             * @function
             * 
             * @description wrapper for IDBObjectStore.put.
             * modifies existing values or inserts as new value if nonexistant
             * input data can be a single object or an array of objects for
             * bulk updates/insertions within a single transaction
             * 
             * @params {object or array} data the data to upsert
             * @returns {object} $q.promise a promise on successfull execution
             */
                upsert: function(data) {
                    var d = $q.defer();
                    return this.internalObjectStore(this.storeName, READWRITE).then(function(store) {
                        var req;
                        return angular.isArray(data) ? data.forEach(function(item) {
                            req = store.put(item), req.onsuccess = req.onerror = function(e) {
                                $rootScope.$apply(function() {
                                    d.resolve(e.target.result);
                                });
                            };
                        }) : (req = store.put(data), req.onsuccess = req.onerror = function(e) {
                            $rootScope.$apply(function() {
                                d.resolve(e.target.result);
                            });
                        }), d.promise;
                    });
                },
                /** 
             * @ngdoc method
             * @name ObjectStore.delete 
             * @function
             * 
             * @description wrapper for IDBObjectStore.delete.
             * deletes the value for the specified primary key
             * 
             * @params {any value} key primary key to indetify a value
             * @returns {object} $q.promise a promise on successfull execution
             */
                "delete": function(key) {
                    var d = $q.defer();
                    return this.internalObjectStore(this.storeName, READWRITE).then(function(store) {
                        var req = store.delete(key);
                        return req.onsuccess = req.onerror = function(e) {
                            $rootScope.$apply(function() {
                                d.resolve(e.target.result);
                            });
                        }, d.promise;
                    });
                },
                /** 
             * @ngdoc method
             * @name ObjectStore.clear 
             * @function
             * 
             * @description wrapper for IDBObjectStore.clear.
             * removes all data in an objectstore
             * 
             * @returns {object} $q.promise a promise on successfull execution
             */
                clear: function() {
                    var d = $q.defer();
                    return this.internalObjectStore(this.storeName, READWRITE).then(function(store) {
                        var req = store.clear();
                        return req.onsuccess = req.onerror = function(e) {
                            $rootScope.$apply(function() {
                                d.resolve(e.target.result);
                            });
                        }, d.promise;
                    });
                },
                /** 
             * @ngdoc method
             * @name ObjectStore.count 
             * @function
             * 
             * @description wrapper for IDBObjectStore.count.
             * returns the number of values in the objectstore, as a promise
             * 
             * @returns {object} $q.promise a promise on successfull execution
             */
                count: function() {
                    return this.internalObjectStore(this.storeName, READONLY).then(function(store) {
                        return store.count();
                    });
                },
                /** 
             * @ngdoc method
             * @name ObjectStore.find 
             * @function
             * 
             * @description wrapper for IDBObjectStore.get and IDBIndex.get.
             * retrieves a single value with specified key, or index-key
             * 
             * @params {any value} keyOrIndex the key to value, or an indexName
             * @params {any value} key the key of an index (*optional*)
             * @returns {any value} value ...wrapped in a promise
             */
                find: function(keyOrIndex, keyIfIndex) {
                    var d = $q.defer(), promise = d.promise;
                    return this.internalObjectStore(this.storeName, READONLY).then(function(store) {
                        var req;
                        return req = keyIfIndex ? store.index(keyOrIndex).get(keyIfIndex) : store.get(keyOrIndex), 
                        req.onsuccess = req.onerror = function(e) {
                            $rootScope.$apply(function() {
                                d.resolve(e.target.result);
                            });
                        }, promise;
                    });
                },
                /** 
             * @ngdoc method
             * @name ObjectStore.getAll 
             * @function
             * 
             * @description wrapper for IDBObjectStore.getAll (or shim).
             * retrieves all values from objectstore using IDBObjectStore.getAll
             * or a cursor request if getAll is not implemented
             * 
             * @returns {array} values ...wrapped in a promise
             */
                getAll: function() {
                    var results = [], d = $q.defer();
                    return this.internalObjectStore(this.storeName, READONLY).then(function(store) {
                        var req;
                        return store.getAll ? (req = store.getAll(), req.onsuccess = req.onerror = function(e) {
                            $rootScope.$apply(function() {
                                d.resolve(e.target.result);
                            });
                        }) : (req = store.openCursor(), req.onsuccess = function(e) {
                            var cursor = e.target.result;
                            cursor ? (results.push(cursor.value), cursor.continue()) : $rootScope.$apply(function() {
                                d.resolve(results);
                            });
                        }, req.onerror = function(e) {
                            d.reject(e.target.result);
                        }), d.promise;
                    });
                },
                /** 
             * @ngdoc method
             * @name ObjectStore.each 
             * @function
             * 
             * @description wrapper for IDBObjectStore.openCursor or IDBIndex.openCursor.
             * returns an IDBCursor for further manipulation. See indexedDB documentation 
             * for details on this.
             * https://developer.mozilla.org/en-US/docs/IndexedDB/Using_IndexedDB#Using_a_cursor
             * 
             * @params {object} options optional query parameters, see defaultQueryOptions
             * and QueryBuilder for details
             * @returns {object} IDBCursor ...wrapped in a promise
             */
                each: function(options) {
                    var d = $q.defer();
                    return this.internalObjectStore(this.storeName, READWRITE).then(function(store) {
                        var req;
                        return options = options || defaultQueryOptions, req = options.useIndex ? store.index(options.useIndex).openCursor(options.keyRange, options.direction) : store.openCursor(options.keyRange, options.direction), 
                        req.onsuccess = req.onerror = function(e) {
                            $rootScope.$apply(function() {
                                d.resolve(e.target.result);
                            });
                        }, d.promise;
                    });
                }
            };
            /** 
         * @ngdoc object
         * @name QueryBuilder 
         * @function
         * 
         * @description utility object to easily create IDBKeyRange for cursor queries
         */
            var QueryBuilder = function() {
                this.result = defaultQueryOptions;
            };
            /** 
         * @ngdoc angular.$provider
         * @name $indexedDB
         * @function
         * 
         * @description indexedDB provider object
         */
            return QueryBuilder.prototype = {
                /** 
             * @ngdoc method
             * @name QueryBuilder.$lt 
             * @function
             * 
             * @description set an upper bound, e.g. A < value, excluding value
             * 
             * @params {any value} value bound value
             * @returns {object} this QueryBuilder, for chaining params
             */
                $lt: function(value) {
                    return this.result.keyRange = IDBKeyRange.upperBound(value, !0), this;
                },
                /** 
             * @ngdoc method
             * @name QueryBuilder.$gt 
             * @function
             * 
             * @description set a lower bound, e.g. A > value, excluding value
             * 
             * @params {any value} value bound value
             * @returns {object} this QueryBuilder, for chaining params
             */
                $gt: function(value) {
                    return this.result.keyRange = IDBKeyRange.lowerBound(value, !0), this;
                },
                /** 
             * @ngdoc method
             * @name QueryBuilder.$lte 
             * @function
             * 
             * @description set an upper bound, e.g. A <= value, including value
             * 
             * @params {any value} value bound value
             * @returns {object} this QueryBuilder, for chaining params
             */
                $lte: function(value) {
                    return this.result.keyRange = IDBKeyRange.upperBound(value), this;
                },
                /** 
             * @ngdoc method
             * @name QueryBuilder.$gte 
             * @function
             * 
             * @description set an upper bound, e.g. A >= value, including value
             * 
             * @params {any value} value bound value
             * @returns {object} this QueryBuilder, for chaining params
             */
                $gte: function(value) {
                    return this.result.keyRange = IDBKeyRange.lowerBound(value), this;
                },
                /** 
             * @ngdoc method
             * @name QueryBuilder.$eq 
             * @function
             * 
             * @description exact match, e.g. A = value
             * 
             * @params {any value} value bound value
             * @returns {object} this QueryBuilder, for chaining params
             */
                $eq: function(value) {
                    return this.result.keyRange = IDBKeyRange.only(value), this;
                },
                /** 
             * @ngdoc method
             * @name QueryBuilder.$between 
             * @function
             * 
             * @description set an upper and lower bound, e.g. low >= value <= hi,
             * optionally including value
             * 
             * @params {any value} lowValue lower bound value
             * @params {any value} hiValue upper bound value
             * @params {boolean} exLow optional, exclude lower bound value
             * @params {boolean} exHi optional, exclude upper bound value
             * @returns {object} this QueryBuilder, for chaining params
             */
                $between: function(lowValue, hiValue, exLow, exHi) {
                    return this.result.keyRange = IDBKeyRange.bound(lowValue, hiValue, exLow || !1, exHi || !1), 
                    this;
                },
                /** 
             * @ngdoc method
             * @name QueryBuilder.$asc
             * @function
             * 
             * @description set the direction of traversal to ascending (natural)
             * 
             * @params {boolean} unique return only distinct values, skipping 
             * duplicates (*optional*)
             * @returns {object} this QueryBuilder, for chaining params
             */
                $asc: function(unique) {
                    return this.result.order = unique ? NEXTUNIQUE : NEXT, this;
                },
                /** 
             * @ngdoc method
             * @name QueryBuilder.$desc
             * @function
             * 
             * @description set the direction of traversal to descending order
             * 
             * @params {boolean} unique return only distinct values, skipping 
             * duplicates (*optional*)
             * @returns {object} this QueryBuilder, for chaining params
             */
                $desc: function(unique) {
                    return this.result.order = unique ? PREVUNIQUE : PREV, this;
                },
                /** 
             * @ngdoc method
             * @name QueryBuilder.$index
             * @function
             * 
             * @description optionally specify an index to use
             * 
             * @params {string} indexName index to use
             * @returns {object} this QueryBuilder, for chaining params
             */
                $index: function(indexName) {
                    return this.result.useIndex = indexName, this;
                },
                /** 
             * @ngdoc method
             * @name QueryBuilder.compile
             * @function
             * 
             * @description returns an object to be passed to ObjectStore.each
             * @returns {object} queryOptions 
             */
                compile: function() {
                    return this.result;
                }
            }, {
                /** 
             * @ngdoc method
             * @name $indexedDB.objectStore
             * @function
             * 
             * @description an IDBObjectStore to use
             * 
             * @params {string} storename the name of the objectstore to use
             * @returns {object} ObjectStore
             */
                objectStore: function(storeName) {
                    return new ObjectStore(storeName);
                },
                /** 
             * @ngdoc method
             * @name $indexedDB.dbInfo
             * @function
             * 
             * @description statistical information about the current database
             * - database name and version
             * - objectstores in in database with name, value count, keyPath, 
             *   autoincrement flag and current assigned indices
             * 
             * @returns {object} DBInfo
             */
                dbInfo: function() {
                    var storeNames, tx, store, stores = [];
                    return dbPromise().then(function(db) {
                        return storeNames = Array.prototype.slice.apply(db.objectStoreNames), tx = db.transaction(storeNames, READONLY), 
                        storeNames.forEach(function(storeName) {
                            store = tx.objectStore(storeName), stores.push({
                                name: storeName,
                                keyPath: store.keyPath,
                                autoIncrement: store.autoIncrement,
                                count: store.count(),
                                indices: Array.prototype.slice.apply(store.indexNames)
                            });
                        }), {
                            name: db.name,
                            version: db.version,
                            objectStores: stores
                        };
                    });
                },
                /** 
             * @ngdoc method
             * @name $indexedDB.close
             * @function
             * 
             * @description closes the current active database
             * @returns {object} this
             */
                closeDB: function() {
                    return dbPromise().then(function(db) {
                        db.close();
                    }), this;
                },
                /** 
             * @ngdoc method
             * @name $indexedDB.switchDB
             * @function
             * 
             * @description closes the current active database and opens another one
             * 
             * @params {string} databaseName the name of the database to use
             * @params {number} version the version number of the database 
             * @params {Function} upgradeCallBack the callback which proceeds the upgrade
             * @returns {object} this
             */
                switchDB: function(databaseName, version, upgradeCallback) {
                    if (version && version !== parseInt(version)) throw "Database error: version needs to be a positive intenger";
                    return this.closeDB(), module.db = null, module.dbName = databaseName, module.dbVersion = version || 1, 
                    module.upgradeCallback = upgradeCallback || function() {}, this;
                },
                /** 
             * @ngdoc method
             * @name $indexedDB.queryBuilder
             * @function
             * 
             * @description provides access to the QueryBuilder utility
             * 
             * @returns {object} QueryBuilder
             */
                queryBuilder: function() {
                    return new QueryBuilder();
                }
            };
        } ];
    }), function() {
        function binaryToBlob(byteString, mime) {
            var arrayBuffer, intArray, i;
            for (// Write the bytes of the string to an ArrayBuffer:
            arrayBuffer = new ArrayBuffer(byteString.length), intArray = new Uint8Array(arrayBuffer), 
            i = 0; i < byteString.length; i += 1) intArray[i] = byteString.charCodeAt(i);
            return new Blob([ hasArrayBufferViewSupport ? intArray : arrayBuffer ], {
                type: mime || "application/octet-stream"
            });
        }
        var hasArrayBufferViewSupport = function() {
            try {
                return 100 === new Blob([ new Uint8Array(100) ]).size;
            } catch (e) {
                return !1;
            }
        }();
        app.service("db", [ "$indexedDB", "$q", function($indexedDB, $q) {
            function encode(file) {
                var defered = $q.defer(), reader = new FileReader();
                return reader.onload = function() {
                    file.blob = reader.result, defered.resolve(file);
                }, reader.readAsBinaryString(file.blob), defered.promise;
            }
            var IDBBlobSupport = !1, OBJECT_STORE_NAME = "fontStore", myObjectStore = $indexedDB.objectStore(OBJECT_STORE_NAME);
            // TODO: relly ugly hack to make indexeddb work, FIX!
            window.shimIndexedDB && !localStorage.cached && (localStorage.cached = 1, window.location.reload()), 
            myObjectStore.insert({
                id: "key",
                blob: "new Blob"
            }).then(function() {
                myObjectStore.delete("key"), IDBBlobSupport = !1;
            }, function() {}), window.e = myObjectStore;
            var service = {
                getFonts: function(id, callback) {
                    myObjectStore.find(id).then(function(font) {
                        font.blob = IDBBlobSupport ? font.blob : binaryToBlob(font.blob), callback(font.blob);
                    });
                },
                addFont: function(file) {
                    IDBBlobSupport ? myObjectStore.insert(file) : encode(file).then(function(file) {
                        myObjectStore.insert(file);
                    });
                },
                remove: function(id) {
                    myObjectStore.delete(id);
                }
            };
            /*
		*/
            return window.fontStore = service, {};
        } ]);
    }();
}({}, function() {
    return this;
}());
//# sourceMappingURL=app.js.map