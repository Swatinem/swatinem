var fs = require('fs');
var path = require('path');
var moment = require('moment');
var mkdirp = require('mkdirp');
var remove = require('remove');
var write = fs.writeFileSync;

var Dir = require('./dir');
var Article = require('./article');
var extend = require('./templates').extend;

module.exports = Articles;

function Articles(options) {
	var self = this;
	this.templates = options.templates;
	this.id = options.top ? '' : path.basename(options.dir) + '/';
	this.dir = new Dir(options.dir);
	this.path = options.dir;
	this.outpath = options.output;
	mkdirp.sync(this.outpath);

	this.subs = [];
	this.byFile = {};
	this.articles = this.dir.files.map(function (file) {
		var stat = fs.statSync(file);
		if (stat.isDirectory()) { // this is quite hacky :-(
			var basename = path.basename(file);
			var sub = new Articles({
				dir: path.join(options.dir, basename),
				output: path.join(options.output, basename),
				templates: options.templates
			});
			self.subs.push(sub);
			return sub;
		}
		return new Article(file, options);
	}).filter(function (a) {
		if (!a) return false;
		self.byFile[a.path] = a;
		return a instanceof Article;
	});
	this.dir.on('change', function (event, file) {
		var article = self.byFile[file];
		if (event === 'delete') {
			var dir = article instanceof Articles;
			var which = self[dir ? 'subs' : 'articles'];
			article.delete();
			var i = which.indexOf(article);
			which.splice(i, 1);
			delete self.byFile[file];
		} else if (event === 'create') {
			var stat = fs.statSync(file);
			if (stat.isDirectory()) { // this is quite hacky :-(
				var basename = path.basename(file);
				article = self.byFile[file] = new Articles({
					dir: path.join(options.dir, basename),
					output: path.join(options.output, basename),
					templates: options.templates
				});
				self.subs.push(article);
			} else {
				article = self.byFile[file] = new Article(file, options);
				self.articles.push(article);
			}
		} else { // change
			article.changed();
		}
		self.changed();
	});

	options.templates.on('change', function (which) {
		if (~['articles', 'all'].indexOf(which))
			self.changed();
		if (~['article', 'all'].indexOf(which))
			self.articles.forEach(function (a) { a.changed(); });
	});

	this.changed();
}

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
	var self = this;
	var templates = this.templates.articles;
	Object.keys(templates).forEach(function (name) {
		var outpath = path.join(self.outpath, name);
		write(outpath, templates[name](extend({moment: moment}, self)));
		console.log('regenerated \033[36m' + outpath + '\033[m');
	});
};

Articles.prototype.delete = function Articles_delete() {
	this.dir.unbind();
	remove.removeSync(this.outpath);
};

