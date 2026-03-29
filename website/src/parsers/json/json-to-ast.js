import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'json-to-ast/package.json';

const ID = 'jsonToAst';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc']),

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['json-to-ast'], callback);
  },

  parse(/** @type {DynModule} */ jsonToAst, /** @type {string} */ code) {
    return jsonToAst(code);
  },

  nodeToRange(/** @type {DynModule} */ {loc}) {
    if (loc) {
      return [
        loc.start.offset,
        loc.end.offset,
      ];
    }
  },
}
