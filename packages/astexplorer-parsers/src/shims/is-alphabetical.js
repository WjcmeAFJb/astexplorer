// Shim: is-alphabetical v2 exports { isAlphabetical } but remark-parse v8 expects default export.
var orig = require('is-alphabetical/index.js');
module.exports = orig.isAlphabetical || orig.default || orig;
