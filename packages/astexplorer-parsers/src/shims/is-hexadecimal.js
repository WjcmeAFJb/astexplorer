// Shim: is-hexadecimal v2 exports { isHexadecimal } but remark-parse v8 expects default export.
var orig = require('is-hexadecimal/index.js');
module.exports = orig.isHexadecimal || orig.default || orig;
