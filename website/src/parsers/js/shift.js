import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'shift-parser/package.json';

const ID = 'shift';

/** @type {*} */
let lastParsedLocations;

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc']),

  loadParser(/** @type {*} */ callback) {
    require(['shift-parser'], callback);
  },

  parse(/** @type {*} */ shift, /** @type {*} */ code, /** @type {*} */ options) {
    const parseMethod = options.sourceType === 'module' ?
      'parseModuleWithLocation' :
      'parseScriptWithLocation';
    const { tree, locations } = shift[parseMethod](code, options);
    lastParsedLocations = locations;
    return tree;
  },

  nodeToRange(/** @type {*} */ node) {
    if (/** @type {*} */ lastParsedLocations && /** @type {*} */ lastParsedLocations.has(node)) {
      let loc = /** @type {*} */ lastParsedLocations.get(node);
      return [loc.start.offset, loc.end.offset];
    }
  },

  opensByDefault(/** @type {*} */ node, /** @type {*} */ key) {
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
