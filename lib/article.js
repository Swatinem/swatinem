var fs = require('fs');
var path = require('path');
var jade = require('jade');
var marked = require('marked');
var moment = require('moment');
var mkdirp = require('mkdirp');
var remove = require('remove');
var read = fs.readFileSync;
var write = fs.writeFileSync;

var extend = require('./templates').extend;

module.exports = Article;

function Article(file, options) {
	this.templates = options.templates;
	this.path = file;
	var idtype = splitName(file);
	if (!idtype)
		return null;
	this.id = idtype[0];
	this.type = idtype[1];
	this.outpath = path.join(options.output, this.id);
	mkdirp.sync(this.outpath);

	this.author = '';
	this.title = '';
	this.time = new Date();
	this.text = '';
	this.tags = [];
	this.changed();
}

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
	var self = this;
	var templates = this.templates.article;
	Object.keys(templates).forEach(function (name) {
		var outpath = path.join(self.outpath, name);
		write(outpath, templates[name](extend({moment: moment}, self)));
		console.log('regenerated \033[36m' + outpath + '\033[m');
	});
};

Article.prototype.delete = function Article_delete() {
	remove.removeSync(this.outpath);
};

var supportedExt = ['md', 'markdown', 'jade', 'html'];

function splitName(file) {
	var type = path.extname(file);
	var id = path.basename(file, type);
	type = type.substr(1);
	if (!~supportedExt.indexOf(type))
		return;
	return [id, type];
}
