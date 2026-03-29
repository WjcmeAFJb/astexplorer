import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'java-parser/package.json';

const ID = 'java-parser';

export const parserSettingsConfiguration = {
  /** @type {*} */
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

  loadParser(/** @type {*} */ callback) {
    require(['java-parser'], callback);
  },

  parse(/** @type {*} */ parser, /** @type {*} */ code) {
    return parser.parse(code);
  },

  _ignoredProperties: new Set(['tokenType']),

  getDefaultOptions() {
    return {};
  },

  getNodeName(/** @type {*} */ { name }) {
    return name;
  },

  nodeToRange(/** @type {*} */ { location }) {
    if (!location) {
      return;
    }
    return [location.startOffset, location.endOffset + 1];
  },
};
