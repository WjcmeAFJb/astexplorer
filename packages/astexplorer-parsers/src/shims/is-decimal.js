// Shim: is-decimal v2 exports { isDecimal } but remark-parse v8 (used by @mdx-js/mdx v1)
// expects a default export. Re-export as default for backwards compatibility.
var orig = require('is-decimal/index.js');
module.exports = orig.isDecimal || orig.default || orig;
