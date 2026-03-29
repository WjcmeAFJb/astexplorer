import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'java-parser/package.json';

/**
 * @typedef {typeof import('java-parser')} JavaParserModule
 * @typedef {{ name?: string, location?: { startOffset: number, endOffset: number }, tokenType?: unknown, [key: string]: unknown }} JavaNode
 */

const ID = 'java-parser';

export const parserSettingsConfiguration = {
  /** @type {string[]} */
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

  loadParser(/** @type {(realParser: Record<string, Function>) => void} */ callback) {
    require(['java-parser'], callback);
  },

  parse(/** @type {Record<string, Function>} */ parser, /** @type {string} */ code) {
    return parser.parse(code);
  },

  _ignoredProperties: new Set(['tokenType']),

  getDefaultOptions() {
    return {};
  },

  getNodeName(/** @type {Record<string, Function>} */ { name }) {
    return name;
  },

  nodeToRange(/** @type {Record<string, Function>} */ { location }) {
    if (!location) {
      return;
    }
    return [location.startOffset, location.endOffset + 1];
  },
};
