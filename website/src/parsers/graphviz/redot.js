import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'redot/package.json';

/**
 * @typedef {((options?: object) => { parse(code: string): RedotNode }) & Record<string, unknown>} RedotParser
 * @typedef {{ position?: { start: { offset: number }, end: { offset: number } }, children?: RedotNode[], [key: string]: unknown }} RedotNode
 */

const ID = 'redot';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['position']),

  loadParser(/** @type {(realParser: RedotParser) => void} */ callback) {
    require(['redot'], callback);
  },

  parse(/** @type {RedotParser} */ redot, /** @type {string} */ code) {
    return redot().parse(code);
  },

  nodeToRange(/** @type {RedotNode} */ { position }) {
    if (position) {
      return [position.start.offset, position.end.offset];
    }
  },

  opensByDefault(/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
    return key === 'children';
  },
};
