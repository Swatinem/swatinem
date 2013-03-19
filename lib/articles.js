var fs = require('fs');
var path = require('path');
var jade = require('jade');
var marked = require('marked');
var moment = require('moment');
var read = fs.readFileSync;
var write = fs.writeFileSync;
var Emitter = require('events').EventEmitter;

var supportedExt = ['md', 'markdown', 'jade', 'html'];

module.exports = function (options) {
	options = options || {};
	options.dir = options.dir || 'articles';
	options.output = options.output || 'generated';
	options.templates = new Templates(options.templates || 'templates');

	return new Articles(options);
};

function splitName(file) {
	var type = path.extname(file);
	var id = path.basename(file, type);
	type = type.substr(1);
	if (!~supportedExt.indexOf(type))
		return;
	return [id, type];
}

function Articles(options) {
	Emitter.call(this);
	var dir = options.dir;
	this.templates = options.templates;
	var files = fs.readdirSync(dir);
	this.byId = {};
	this.articles = files.map(function (file) {
		return new Article(path.join(dir, file), options);
	}).filter(function (a) {
		if (!a) return false;
		this.byId[a.id] = a;
		return true;
	}.bind(this));
	fs.watch(dir, function (event, file) {
		if (!file) return;
		file = path.join(dir, file);
		var idtype = splitName(file);
		if (!idtype) return;
		var id = idtype[0];
		var deleted = !fs.existsSync(file);
		if (id in this.byId) {
			var article = this.byId[id];
			if (deleted) {
				try {
					fs.unlinkSync(article.outpath);
				} catch(e) {}
				var i = this.articles.indexOf(article);
				this.articles.splice(i, 1);
				delete this.byId[id];
			} else
				article.emit('change');
		} else {
			var article = new Article(file, options);
			this.byId[id] = article;
			this.articles.push(article);
			article.emit('change');
		}
		this.emit('change');
	}.bind(this));

	this.outpath = path.join(options.output, 'index.html');

	this.changed();
	this.on('change', this.changed.bind(this));
	options.templates.on('change', function () {
		this.emit('change', 'force');
		this.articles.forEach(function (a) { a.emit('change', 'force'); });
	}.bind(this));
}

Articles.prototype = Object.create(Emitter.prototype);

Articles.prototype.sort = function Articles_sort() {
	this.articles.sort(function (a, b) {
		return b.time - a.time;
	});
};

Articles.prototype.changed = function Articles_changed() {
	this.sort();
	this.render();
};

Articles.prototype.render = function Articles_render() {
	write(this.outpath, this.templates.index(extend({moment: moment}, this)));
	console.log('regenerated \033[36m' + this.outpath + '\033[m');
};

function Article(file, options) {
	Emitter.call(this);
	this.templates = options.templates;
	this.path = file;
	var idtype = splitName(file);
	if (!idtype)
		return null;
	this.id = idtype[0];
	this.type = idtype[1];
	this.outpath = path.join(options.output, this.id + '.html');

	this.author = '';
	this.title = '';
	this.time = new Date();
	this.text = '';
	this.tags = [];
	this.changed();
	this.on('change', this.changed.bind(this));
}

Article.prototype = Object.create(Emitter.prototype);

Article.prototype.changed = function Article_changed() {
	this.parse();
	this.render();
};

Article.prototype.parse = function Article_parse() {
	var contents = read(this.path, 'utf8').split('\n');
	var re = /^([a-z]+):\s*([^\n]+)\s*$/;
	for (var i = 0; i < contents.length; i++) {
		var match = contents[i].match(re);
		if (!match)
			break;
		if (match[1] == 'tags')
			this.tags = match[2].split(/\s*,\s*/);
		else if (match[1] == 'time')
			this.time = new Date(match[2]);
		else if (~['author', 'title'].indexOf(match[1]))
			this[match[1]] = match[2];
	}
	this.text = contents.slice(i).join('\n');
	if (this.type == 'jade')
		this.text = jade.compile(this.text)();
	else if (~['md', 'markdown'].indexOf(this.type))
		this.text = marked(this.text);
};

Article.prototype.render = function Article_render() {
	write(this.outpath, this.templates.article(extend({moment: moment}, this)));
	console.log('regenerated \033[36m' + this.outpath + '\033[m');
};

function Templates(dir) {
	Emitter.call(this);
	this.dir = dir;
	fs.watch(dir, function (event, file) {
		if (!~file.indexOf('.jade'))
			return;
		this.emit('change');
	}.bind(this));
	this.create();
	this.on('change', this.create.bind(this));
}

Templates.prototype = Object.create(Emitter.prototype);

Templates.prototype.create = function Templates_create() {
	['article', 'index'].forEach(function (tpl) {
		var file = path.join(this.dir, tpl + '.jade');
		this[tpl] = jade.compile(read(file, 'utf8'), {
			filename: file
		});
	}.bind(this));
};

function extend(a, b) {
	for (var k in b) {
		a[k] = b[k];
	}
	return a;
}
