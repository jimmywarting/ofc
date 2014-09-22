"use strict";
/* **********************************************
Dependency
********************************************** */
var express = require("express"),
	path = require('path'),
	app = express();

app.listen(9001);

// If file dosn't exist, send index.html
app.use(function (req, res, next) {
	if ( ! path.extname(req.path).length > 0 ) {
		req.url = '/';
	}
	next();
});

app.use(express.static(__dirname + '/public'));