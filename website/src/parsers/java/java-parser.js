import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'java-parser/package.json';

const ID = 'java-parser';

export const parserSettingsConfiguration = {
  /** @type {ASTNode} */
  fields: [],
};

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage:
    pkg.homepage ||
    'https://github.com/jhipster/prettier-java/tree/master/packages/java-parser',

  locationProps: new Set(['location']),
  typeProps: new Set(['name']),

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['java-parser'], callback);
  },

  parse(/** @type {DynModule} */ parser, /** @type {string} */ code) {
    return parser.parse(code);
  },

  _ignoredProperties: new Set(['tokenType']),

  getDefaultOptions() {
    return {};
  },

  getNodeName(/** @type {DynModule} */ { name }) {
    return name;
  },

  nodeToRange(/** @type {DynModule} */ { location }) {
    if (!location) {
      return;
    }
    return [location.startOffset, location.endOffset + 1];
  },
};
