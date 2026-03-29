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

  loadParser(/** @type {*} */ callback) {
    require(['json-to-ast'], callback);
  },

  parse(/** @type {*} */ jsonToAst, /** @type {*} */ code) {
    return jsonToAst(code);
  },

  nodeToRange(/** @type {*} */ {loc}) {
    if (loc) {
      return [
        loc.start.offset,
        loc.end.offset,
      ];
    }
  },
}
