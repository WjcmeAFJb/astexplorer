import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'shift-parser/package.json';

const ID = 'shift';

/** @type {Record<string, unknown>} */
let lastParsedLocations;

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc']),

  loadParser(/** @type {(realParser: any) => void} */ callback) {
    require(['shift-parser'], callback);
  },

  parse(/** @type {any} */ shift, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    const parseMethod = options.sourceType === 'module' ?
      'parseModuleWithLocation' :
      'parseScriptWithLocation';
    const { tree, locations } = shift[parseMethod](code, options);
    lastParsedLocations = locations;
    return tree;
  },

  nodeToRange(/** @type {any} */ node) {
    if (/** @type {any} */ (lastParsedLocations) && /** @type {any} */ (lastParsedLocations).has(node)) {
      let loc = /** @type {any} */ (lastParsedLocations).get(node);
      return [loc.start.offset, loc.end.offset];
    }
  },

  opensByDefault(/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
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
