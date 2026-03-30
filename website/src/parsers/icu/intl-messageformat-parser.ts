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

  loadParser(callback: (realParser: IntlMFParserModule) => void) {
    require(['intl-messageformat-parser'], (all: IntlMFParserModule) => {
      Object.keys(all.TYPE).forEach((k) => {
        // @ts-expect-error — indexing dynamic object
        // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- @ts-expect-error makes type error
        TYPES[k] = all.TYPE[k];
      });
      callback(all);
    });
  },

  parse(parser: IntlMFParserModule, code: string, opts: import('intl-messageformat-parser').ParseOptions) {
    return parser.parse(code, opts);
  },

  _getSettingsConfiguration() {
    return parserSettingsConfiguration;
  },

  getDefaultOptions() {
    return defaultOptions;
  },

  getNodeName(node: IntlMFNode) {
    // @ts-expect-error — indexing dynamic object
    // oxlint-disable-next-line typescript-eslint(no-unsafe-return) -- @ts-expect-error makes type error
    return node.type != null && TYPES[node.type];
  },

  nodeToRange(/** @type {{location?: {start: {offset: number}, end: {offset: number}}}} */ { location }) {
    if (location && location.start && location.end) {
      return [location.start.offset, location.end.offset];
    }
  },
};
