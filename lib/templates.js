var fs = require('fs');
var path = require('path');
var jade = require('jade');
var read = fs.readFileSync;
var Emitter = require('events').EventEmitter;

var Dir = require('./dir');

module.exports = Templates;

function Templates(dir) {
	Emitter.call(this);
	var self = this;

	this.articles = {};
	this.article = {};

	['articles', 'article'].forEach(function (which) {
		var d = new Dir(path.join(dir, '_' + which));
		d.files.forEach(function (file) {
			var template = path.basename(file, '.jade');
			self[which][template] = create(file);
		});
		d.on('change', function (event, file) {
			var template = path.basename(file, '.jade');
			if (event === 'delete') {
				delete self[which][template];
				return;
			}
			self[which][template] = create(file);
			self.emit('change', which);
		});
	});
	new Dir(path.join(dir, '_includes')).on('change', function (event, file) {
		if (event !== 'change')
			return;
		['articles', 'article'].forEach(function (which) {
			Object.keys(self[which]).forEach(function (name) {
				self[which][name] = create(path.join(dir, '_' + which, name + '.jade'));
			});
		});
		self.emit('change', 'all');
	});

	function create(file) {
		// FIXME: dont crash!
		return jade.compile(read(file, 'utf8'), {
			filename: file
		});
	}
}

Templates.prototype = Object.create(Emitter.prototype);

Templates.extend = extend;

function extend(a, b) {
	for (var k in b) {
		a[k] = b[k];
	}
	return a;
}
