import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from '@humanwhocodes/momoa/package.json';

/**
 * @typedef {{ parse(code: string, options?: Record<string, unknown>): MomoaNode }} MomoaParser
 * @typedef {{ loc?: { start: { offset: number }, end: { offset: number } }, [key: string]: unknown }} MomoaNode
 */

const ID = 'momoa';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc']),

  loadParser(/** @type {(realParser: Record<string, any>) => void} */ callback) {
    require(['@humanwhocodes/momoa'], callback);
  },

  parse(/** @type {Record<string, any>} */ momoa, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    return momoa.parse(code, options);
  },

  nodeToRange(/** @type {Record<string, any>} */ {loc}) {
    if (loc) {
      return [
        loc.start.offset,
        loc.end.offset,
      ];
    }
  },

  getDefaultOptions() {
    return {
      comments: true,
      tokens: true,
      ranges: true,
    };
  },

}
