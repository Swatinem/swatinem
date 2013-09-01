var Templates = require('./templates');
var Articles = require('./articles');

module.exports = function (options) {
	options = options || {};
	options.dir = options.dir || 'articles';
	options.output = options.output || 'generated';
	options.templates = new Templates(options.templates || 'templates');
	options.top = true;

	return new Articles(options);
};

