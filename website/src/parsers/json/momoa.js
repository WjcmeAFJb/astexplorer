import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from '@humanwhocodes/momoa/package.json';

const ID = 'momoa';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc']),

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['@humanwhocodes/momoa'], callback);
  },

  parse(/** @type {DynModule} */ momoa, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    return momoa.parse(code, options);
  },

  nodeToRange(/** @type {DynModule} */ {loc}) {
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
