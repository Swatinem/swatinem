var path = require('path');

require('./lib')({
	dir: path.join(__dirname, 'articles'),
	output: path.join(__dirname, 'generated'),
	templates: path.join(__dirname, 'templates')
});

/*
var express = require('express');
var app = express();

app.configure('development', function() {
	app.use(express.logger('dev'));
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure(function() {
	app.set('port', process.env.PORT || 3000);
	app.set('trust proxy', true);
	app.use(app.router);
	//app.use(express.static('generated'));
});

app.get('/news/:id', function (req, res, next) {
	if (!(req.params.id in articles.byId))
		return next();
	res.header("Content-Type", "text/html; charset=utf-8");
	res.send(articles.byId[req.params.id].generated);
});

if (!module.parent) {
	var http = require('http');
	var port = app.get('port');
	var server = http.createServer(app).listen(port, '127.0.0.1', function () {
		console.log("Express server listening on port %d", port);
	});
}*/
