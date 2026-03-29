import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'shift-parser/package.json';

const ID = 'shift';

/** @type {ASTNode} */
let lastParsedLocations;

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc']),

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['shift-parser'], callback);
  },

  parse(/** @type {DynModule} */ shift, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    const parseMethod = options.sourceType === 'module' ?
      'parseModuleWithLocation' :
      'parseScriptWithLocation';
    const { tree, locations } = shift[parseMethod](code, options);
    lastParsedLocations = locations;
    return tree;
  },

  nodeToRange(/** @type {ASTNode} */ node) {
    if (/** @type {ASTNode} */ lastParsedLocations && /** @type {ASTNode} */ lastParsedLocations.has(node)) {
      let loc = /** @type {ASTNode} */ lastParsedLocations.get(node);
      return [loc.start.offset, loc.end.offset];
    }
  },

  opensByDefault(/** @type {ASTNode} */ node, /** @type {string} */ key) {
    return (
      key === 'items' ||
      key === 'declaration' ||
      key === 'declarators' ||
      key === 'statements' ||
      key === 'expression' ||
      key === 'body'
    );
  },

  getDefaultOptions() {
    return {
      earlyErrors: false,
      sourceType: 'module',
    };
  },

  _getSettingsConfiguration() {
    return {
      fields: [
        ['sourceType', ['script', 'module']],
        'earlyErrors',
      ],
    };
  },

};
