var fs = require('fs');
var path = require('path');
var Emitter = require('events').EventEmitter;

module.exports = Dir;

function Dir(dir) {
	var self = this;
	Emitter.call(this);

	this.dir = dir;
	this.files = [];

	var files = fs.readdirSync(dir);
	this.files = files.map(function (file) {
		if (file[0] === '.')
			return; // ignore hidden files
		return path.join(dir, file);
	}).filter(function (i) { return i; });

	//var events = [];
	this.watcher = fs.watch(dir, function () {
		/*if (!events.length)
			setImmediate(function () {
				handleEvent.apply(self, events.pop());
				events = [];
			});
		events.push(arguments);*/
		handleEvent.apply(self, arguments);
	});

	function handleEvent(event, file) {
		if (!file || file[0] === '.')
			return; // ignore hidden files
		file = path.join(dir, file);
		if (event === 'rename') {
			var deleted = !fs.existsSync(file);
			var index = this.files.indexOf(file);
			if (deleted) {
				this.files.splice(index, 1);
				return this.emit('change', 'delete', file);
			}
			// else: create or change
			if (!~index) {
				this.files.push(file);
				return this.emit('change', 'create', file);
			}
		}
		// else: change
		return this.emit('change', 'change', file);
	}
}

Dir.prototype = Object.create(Emitter.prototype);

Dir.prototype.unbind = function Dir_unbind() {
	this.watcher.close();
};
