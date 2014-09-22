app.factory('filesystem', ['$rootScope', function($rootScope) {

	var 
	URL = window.URL || window.webkitURL,
	requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem,
	resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL,
	storageInfo = window.storageInfo || window.webkitStorageInfo,
	BlobBuilder = window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder,

	Filer = new function() {


		var 
		FS_INIT_ERROR_MSG = 'Filesystem has not been initialized.',
		NOT_IMPLEMENTED_MSG = 'Not implemented.',
		NOT_A_DIRECTORY = 'Path was not a directory.',
		INCORRECT_ARGS = 'These method arguments are not supported.',
		FS_URL_SCHEME = 'filesystem:',
DEFAULT_FS_SIZE = 1024 * 1024, // 1MB.

fs_ = null,
cwd_ = null,
isOpen_ = false,

initialized = function() {
	if (!fs_) {
		throw new Error(FS_INIT_ERROR_MSG);
	}
},

// Path can be relative or absolute. If relative, it's taken from the cwd_.
// If a filesystem URL is passed it, it is simple returned
pathToFsURL_ = function(path) {
	if (!path.startsWith(FS_URL_SCHEME)) {
		if (path.startsWith('/')) {
			path = fs_.root.toURL() + path.substring(1);
		} else if (path.startsWith('./') || path.startsWith('../')) {
			if (path == '../' && cwd_ != fs_.root) {
				path = cwd_.toURL() + '/' + path;
			} else {
				path = cwd_.toURL() + path;
			}
		} else {
			path = cwd_.toURL() + '/' + path;
		}
	}

	return path;
},

/**
* Looks up a FileEntry or DirectoryEntry for a given path.
*
* @param {function(...FileEntry|DirectorEntry)} callback A callback to be
*     passed the entry/entries that were fetched. The ordering of the
*     entries passed to the callback correspond to the same order passed
*     to this method.
* @param {...string} var_args 1-2 paths to lookup and return entries for.
*     These can be paths or filesystem: URLs.
*/
getEntry_ = function(callback, var_args) {
	var srcStr = arguments[1];
	var destStr = arguments[2];

	var onError = function(e) {
		if (e.code == FileError.NOT_FOUND_ERR) {
			if (destStr) {
				throw new Error('"' + srcStr + '" or "' + destStr +
					'" does not exist.');
			} else {
				throw new Error('"' + srcStr + '" does not exist.');
			}
		} else {
			throw new Error('Problem getting Entry for one or more paths.');
		}
	};

// Build a filesystem: URL manually if we need to.
var src = pathToFsURL_(srcStr);

if (arguments.length == 3) {
	var dest = pathToFsURL_(destStr);
	window.resolveLocalFileSystemURL(src, function(srcEntry) {
		window.resolveLocalFileSystemURL(dest, function(destEntry) {
			callback(srcEntry, destEntry);
		}, onError);
	}, onError);
} else {
	window.resolveLocalFileSystemURL(src, callback, onError);
}
};

/**
* Copy or moves a file or directory to a destination.
*
* See public method's description (Filer.cp()) for rest of params.
* @param {Boolean=} opt_deleteOrig True if the original entry should be
*     deleted after the copy takes place, essentially making the operation
*     a move instead of a copy. Defaults to false.
*/
var copyOrMove_ = function(src, dest, opt_newName, opt_successCallback,
	opt_errorHandler, opt_deleteOrig) {
	var window = this;

	if (!fs_) {
		throw new Error(FS_INIT_ERROR_MSG);
	}

	if (typeof src != typeof dest) {
		throw new Error(INCORRECT_ARGS);
	}

	var newName = opt_newName || null;
	var deleteOrig = opt_deleteOrig != undefined ? opt_deleteOrig : false;

	if ((src.isFile || dest.isDirectory) && dest.isDirectory) {
		if (deleteOrig) {
			src.moveTo(dest, newName, opt_successCallback, opt_errorHandler);
		} else {
			src.copyTo(dest, newName, opt_successCallback, opt_errorHandler);
		}
	} else {
		getEntry_(function(srcEntry, destDir) {
			if (!destDir.isDirectory) {
				var e = new Error('Oops! "' + destDir.name + ' is not a directory!');
				if (opt_errorHandler) {
					opt_errorHandler(e);
				} else {
					throw e;
				}
				return;
			}
			if (deleteOrig) {
				srcEntry.moveTo(destDir, newName, opt_successCallback, opt_errorHandler);
			} else {
				srcEntry.copyTo(destDir, newName, opt_successCallback, opt_errorHandler);
			}
		}, src, dest);
	}
}

function Filer(fs) {
	fs_  = fs || null;
	if (fs_) {
		cwd_ = fs_.root;
isOpen_ = true; // TODO: this may not be the case.
}
}

Filer.DEFAULT_FS_SIZE = DEFAULT_FS_SIZE;
Filer.version = '0.4';

Filer.prototype = {
	get fs() {
		return fs_;
	},
	get isOpen() {
		return isOpen_;
	},
	get cwd() {
		return cwd_;
	}
}

/**
* Constructs and returns a filesystem: URL given a path.
*
* @param {string=} path The path to construct a URL for.
*     size {int=} The storage size (in bytes) to open the filesystem with.
*         Defaults to DEFAULT_FS_SIZE.
* @return {string} The filesystem: URL.
*/
Filer.prototype.pathToFilesystemURL = function(path) {
	return pathToFsURL_(path);
}

/**
* Initializes (opens) the file system.
*
* @param {object=} opt_initObj Optional object literal with the following
*     properties. Note: If {} or null is passed, default values are used.
*     persistent {Boolean=} Whether the browser should use persistent quota.
*         Default is false.
*     size {int=} The storage size (in bytes) to open the filesystem with.
*         Defaults to DEFAULT_FS_SIZE.
* @param {Function=} opt_successCallback Optional success handler passed a
*      DOMFileSystem object.
* @param {Function=} opt_errorHandler Optional error callback.
*/
Filer.prototype.init = function(opt_initObj, opt_successCallback,
	opt_errorHandler) {
	if (!requestFileSystem) {
		throw new MyFileError({
			code: FileError.BROWSER_NOT_SUPPORTED,
			name: 'BROWSER_NOT_SUPPORTED'
		});
	}

var initObj = opt_initObj ? opt_initObj : {}; // Use defaults if obj is null.

var size = initObj.size || DEFAULT_FS_SIZE;
this.type = window.TEMPORARY;
if ('persistent' in initObj && initObj.persistent) {
	this.type = window.PERSISTENT;
}

var init = function(fs) {
	this.size = size;
	fs_ = fs;
	cwd_ = fs_.root;
	isOpen_ = true;

	opt_successCallback && opt_successCallback(fs);
};

if (this.type == window.PERSISTENT && !!window.storageInfo) {
	window.storageInfo.requestQuota(this.type, size, function(grantedBytes) {
		requestFileSystem(
			this.type, grantedBytes, init.bind(this), opt_errorHandler);
	}.bind(this), opt_errorHandler);
} else {
	requestFileSystem(
		this.type, size, init.bind(this), opt_errorHandler);
}
};

/**
* Reads the contents of a directory.
*
* @param {string|DirectoryEntry} dirEntryOrPath A path relative to the
*     current working directory. In most cases that is the root entry, unless
*     cd() has been called. A DirectoryEntry or filesystem URL can also be
*     passed, in which case, the folder's contents will be returned.
* @param {Function} successCallback Success handler passed an Array<Entry>.
* @param {Function=} opt_errorHandler Optional error callback.
*/
Filer.prototype.ls = function(dirEntryOrPath, successCallback, opt_errorHandler) {
	initialized();
	var list = [],
	
	callback = function(dirEntry) {
		cwd_ = dirEntry;

		// Read contents of current working directory. According to spec, need to
		// keep calling readEntries() until length of result array is 0. We're
		// guarenteed the same entry won't be returned again.
		var entries = [],
			reader = cwd_.createReader(),

		readEntries = function() {
			reader.readEntries(function(results) {
				if (!results.length) {
					// By default, sort the list by name.
					var foo = entries.sort(function(a, b) {
						return a.name < b.name ? -1 : b.name < a.name ? 1 : 0;
					});
					console.log(foo);
					console.log(foo);
					console.log(foo);
					console.log(foo);
					$rootScope.$apply();
					successCallback(entries);
				} else {
					entries = entries.concat(results);
					readEntries();
				}
			}, opt_errorHandler);
		};

		readEntries();
	};

	if (dirEntryOrPath.isDirectory) { // passed a DirectoryEntry.
		callback(dirEntryOrPath);
	} else if (dirEntryOrPath.startsWith(FS_URL_SCHEME)) { // passed a filesystem URL.
		getEntry_(callback, pathToFsURL_(dirEntryOrPath));
	} else {
		// Passed a path. Look up DirectoryEntry and proceeed.
		// TODO: Find way to use getEntry_(callback, dirEntryOrPath); with cwd_.
		cwd_.getDirectory(dirEntryOrPath, {}, callback, opt_errorHandler);
	}
	return list;
};

/**
* Creates a new directory.
*
* @param {string} path The name of the directory to create. If a path is
*     given, each intermediate dir is created (e.g. similar to mkdir -p).
* @param {bool=} opt_exclusive True if an error should be thrown if
*     one or more of the directories already exists. False by default.
* @param {Function} successCallback Success handler passed the
*     DirectoryEntry that was created. If we were passed a path, the last
*     directory that was created is passed back.
* @param {Function=} opt_errorHandler Optional error callback.
*/
Filer.prototype.mkdir = function(path, opt_exclusive, successCallback,
	opt_errorHandler) {
	if (!fs_) {
		throw new Error(FS_INIT_ERROR_MSG);
	}

	var exclusive = opt_exclusive != null ? opt_exclusive : false;

	var folderParts = path.split('/');

	var createDir = function(rootDir, folders) {
// Throw out './' or '/' and move on. Prevents: '/foo/.//bar'.
if (folders[0] == '.' || folders[0] == '') {
	folders = folders.slice(1);
}

rootDir.getDirectory(folders[0], {create: true, exclusive: exclusive},
	function (dirEntry) {
if (dirEntry.isDirectory) { // TODO: check shouldn't be necessary.
// Recursively add the new subfolder if we have more to create and
// There was more than one folder to create.
if (folders.length && folderParts.length != 1) {
	createDir(dirEntry, folders.slice(1));
} else {
// Return the last directory that was created.
successCallback(dirEntry);
}
} else {
	var e = new Error(path + ' is not a directory');
	if (opt_errorHandler) {
		opt_errorHandler(e);
	} else {
		throw e;
	}
}
},
function(e) {
	if (e.code == FileError.INVALID_MODIFICATION_ERR) {
		e.message = "'" + path + "' already exists";
		if (opt_errorHandler) {
			opt_errorHandler(e);
		} else {
			throw e;
		}
	}
}
);
};

createDir(cwd_, folderParts);
};

/**
* Looks up and return a File for a given file entry.
*
* @param {string|FileEntry} entryOrPath A path, filesystem URL, or FileEntry
*     of the file to lookup.
* @param {Function} successCallback Success callback passed the File object.
* @param {Function=} opt_errorHandler Optional error callback.
*/
Filer.prototype.open = function(entryOrPath, successCallback, opt_errorHandler) {
	if (!fs_) {
		throw new Error(FS_INIT_ERROR_MSG);
	}

	if (entryOrPath.isFile) {
		entryOrPath.file(successCallback, opt_errorHandler);
	} else {
		getEntry_(function(fileEntry) {
			fileEntry.file(successCallback, opt_errorHandler);
		}, pathToFsURL_(entryOrPath));
	}
};

/**
* Creates an empty file.
*
* @param {string} path The relative path of the file to create, from the
*     current working directory.
* @param {bool=} exclusive True (default) if an error should be thrown if
*     the file already exists.
* @param {Function} successCallback A success callback, which is passed
*     the new FileEntry.
* @param {Function=} opt_errorHandler Optional error callback.
*/
Filer.prototype.create = function(path, exclusive, successCallback, opt_errorHandler) {
	if (!fs_) {
		throw new Error(FS_INIT_ERROR_MSG);
	}

	cwd_.getFile(path, {create: true,  exclusive: !!exclusive}, successCallback, function(e) {
		if (e.code == FileError.INVALID_MODIFICATION_ERR) {
			e.message = "'" + path + "' already exists";
		}
		if (opt_errorHandler) {
			opt_errorHandler(e);
		} else {
			throw e;
		}
	}
	);
};

/**
* Moves a file or directory.
*
* @param {string|FileEntry|DirectoryEntry} src The file/directory
*     to move. If src is a string, a path or filesystem: URL is accepted.
* @param {string|DirectoryEntry} dest The directory to move the src into.
*     If dest is a string, a path or filesystem: URL is accepted.
*     Note: dest needs to be the same type as src.
* @param {string=} opt_newName An optional new name for the moved entry.
* @param {Function=} opt_successCallback Optional callback passed the moved
*     entry on a successful move.
* @param {Function=} opt_errorHandler Optional error callback.
*/
Filer.prototype.mv = function(src, dest, opt_newName, opt_successCallback, opt_errorHandler) {
	copyOrMove_.bind(this, src, dest, opt_newName, opt_successCallback, opt_errorHandler, true)();
};

/**
* Deletes a file or directory entry.
*
* @param {string|FileEntry|DirectoryEntry} entryOrPath The file or directory
*     to remove. If entry is a DirectoryEntry, its contents are removed
*     recursively. If entryOrPath is a string, a path or filesystem: URL is
*     accepted.
* @param {Function} successCallback Zero arg callback invoked on
*     successful removal.
* @param {Function=} opt_errorHandler Optional error callback.
*/
Filer.prototype.rm = function(entryOrPath, successCallback, opt_errorHandler) {
	if (!fs_) {
		throw new Error(FS_INIT_ERROR_MSG);
	}

	var removeIt = function(entry) {
		if (entry.isFile) {
			entry.remove(successCallback, opt_errorHandler);
		} else if (entry.isDirectory) {
			entry.removeRecursively(successCallback, opt_errorHandler);
		}
	};

	if (entryOrPath.isFile || entryOrPath.isDirectory) {
		removeIt(entryOrPath);
	} else {
		getEntry_(removeIt, entryOrPath);
	}
};

/**
* Changes the current working directory.
*
* @param {string|DirectoryEntry} dirEntryOrPath A DirectoryEntry to move into
*     or a path relative to the current working directory. A filesystem: URL
*     is also accepted
* @param {Function=} opt_successCallback Optional success callback, which is
*     passed the DirectoryEntry of the new current directory.
* @param {Function=} opt_errorHandler Optional error callback.
*/
Filer.prototype.cd = function(dirEntryOrPath, opt_successCallback, opt_errorHandler) {
	if (!fs_) {
		throw new Error(FS_INIT_ERROR_MSG);
	}

	if (dirEntryOrPath.isDirectory) {
		cwd_ = dirEntryOrPath;
		opt_successCallback && opt_successCallback(cwd_);
	} else {
// Build a filesystem: URL manually if we need to.
var dirEntryOrPath = pathToFsURL_(dirEntryOrPath);

getEntry_(function(dirEntry) {
	if (dirEntry.isDirectory) {
		cwd_ = dirEntry;
		opt_successCallback && opt_successCallback(cwd_);
	} else {
		var e = new Error(NOT_A_DIRECTORY);
		if (opt_errorHandler) {
			opt_errorHandler(e);
		} else {
			throw e;
		}
	}
}, dirEntryOrPath);
}
};

/**
* Copies a file or directory to a destination.
*
* @param {string|FileEntry|DirectoryEntry} src The file/directory
*     to copy. If src is a string, a path or filesystem: URL is accepted.
* @param {string|DirectoryEntry} dest The directory to copy the src into.
*     If dest is a string, a path or filesystem: URL is accepted.
*     Note: dest needs to be the same type as src.
* @param {string=} opt_newName An optional name for the copied entry.
* @param {Function=} opt_successCallback Optional callback passed the moved
*     entry on a successful copy.
* @param {Function=} opt_errorHandler Optional error callback.
*/
Filer.prototype.cp = function(src, dest, opt_newName, opt_successCallback, opt_errorHandler) {
	copyOrMove_.bind(this, src, dest, opt_newName, opt_successCallback, opt_errorHandler)();
};

/**
* Writes data to a file.
*
* If the file already exists, its contents are overwritten.
*
* @param {string|FileEntry} entryOrPath A path, filesystem URL, or FileEntry
*     of the file to lookup.
* @param {object} dataObj The data to write. Example:
*     {data: string|Blob|File|ArrayBuffer, type: mimetype, append: true}
*     If append is specified, data is appended to the end of the file.
* @param {Function} successCallback Success callback, which is passed
*     the created FileEntry and FileWriter object used to write the data.
* @param {Function=} opt_errorHandler Optional error callback.
*/
Filer.prototype.write = function(entryOrPath, dataObj, successCallback, opt_errorHandler) {
	if (!fs_) {
		throw new Error(FS_INIT_ERROR_MSG);
	}

	var writeFile_ = function(fileEntry) {
		fileEntry.createWriter(function(fileWriter) {

			fileWriter.onerror = opt_errorHandler;

			if (dataObj.append) {
				fileWriter.onwriteend = function(e) {
					successCallback(fileEntry, this);
				};

fileWriter.seek(fileWriter.length); // Start write position at EOF.
} else {
	var truncated = false;
	fileWriter.onwriteend = function(e) {
// Truncate file to newly written file size.
if (!truncated) {
	truncated = true;
	this.truncate(this.position);
	return;
}
successCallback(fileEntry, this);
};
}

// Blob() takes ArrayBufferView, not ArrayBuffer.
if (dataObj.data.__proto__ == ArrayBuffer.prototype) {
	dataObj.data = new Uint8Array(dataObj.data);
}
var blob = new Blob([dataObj.data],
	dataObj.type ? {type: dataObj.type} : {});

fileWriter.write(blob);

}, opt_errorHandler);
	};

	if (entryOrPath.isFile) {
		writeFile_(entryOrPath);
	} else if (entryOrPath.startsWith(FS_URL_SCHEME)) {
		getEntry_(writeFile_, entryOrPath);
	} else {
		cwd_.getFile(entryOrPath, {create: true, exclusive: false}, writeFile_,
			opt_errorHandler);
	}
};

return Filer;
};


return Filer;

}]);