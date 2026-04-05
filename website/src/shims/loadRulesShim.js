// rulesDir param unused — shim ignores all built-in ESLint rules
module.exports = function loadRules() {
  // By default, ESLint tries to load all available rules by looking for every
  // file in its "rules" directory. Since we don't care about any of the bundled
  // rules, just completely ignore them.
  return [];
}
