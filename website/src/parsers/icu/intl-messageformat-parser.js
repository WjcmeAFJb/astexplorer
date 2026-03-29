import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'intl-messageformat-parser/package.json';

/**
 * @typedef {typeof import('intl-messageformat-parser')} IntlMFParserModule
 * @typedef {import('intl-messageformat-parser').MessageFormatElement & { location?: { start: { offset: number }, end: { offset: number } } }} IntlMFNode
 */

const ID = 'intl-messageformat-parser';
const TYPES = {};

export const parserSettingsConfiguration = {
  fields: [
    'captureLocation',
    'ignoreTag',
    'normalizeHashtagInPlural',
    'shouldParseSkeletons',
  ],
};

const defaultOptions = {
  captureLocation: true,
  normalizeHashtagInPlural: true,
};

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage:
    pkg.homepage || 'https://formatjs.io/docs/intl-messageformat-parser/',
  locationProps: new Set(['location']),

  loadParser(/** @type {(realParser: Record<string, any>) => void} */ callback) {
    require(['intl-messageformat-parser'], (/** @type {IntlMFParserModule} */ all) => {
      Object.keys(all.TYPE).forEach((k) => {
        // @ts-expect-error — indexing dynamic object
        TYPES[k] = all.TYPE[k];
      });
      callback(all);
    });
  },

  parse(/** @type {Record<string, any>} */ parser, /** @type {string} */ code, /** @type {Record<string, any>} */ opts) {
    return parser.parse(code, opts);
  },

  _getSettingsConfiguration() {
    return parserSettingsConfiguration;
  },

  getDefaultOptions() {
    return defaultOptions;
  },

  getNodeName(/** @type {Record<string, unknown>} */ node) {
    // @ts-expect-error — indexing dynamic object
    return node.type != null && TYPES[node.type];
  },

  nodeToRange(/** @type {Record<string, any>} */ { location }) {
    if (location && location.start && location.end) {
      return [location.start.offset, location.end.offset];
    }
  },
};
