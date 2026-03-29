import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'lucene/package.json';

/**
 * @typedef {{ parse(code: string): object }} LuceneParser
 * @typedef {{ location?: LuceneLocation, fieldLocation?: LuceneLocation, termLocation?: LuceneLocation, [key: string]: unknown }} LuceneNode
 * @typedef {{ start: { offset: number }, end: { offset: number } }} LuceneLocation
 */

const ID = 'lucene';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['fieldLocation', 'termLocation', 'location']),

  loadParser(/** @type {(realParser: Record<string, any>) => void} */ callback) {
    require(['lucene'], callback);
  },

  parse(/** @type {Record<string, any>} */ {parse}, /** @type {string} */ code) {
    return parse(code);
  },

  nodeToRange(/** @type {LuceneNode} */ node) {
    let start = [];
    let end = [];

    if (node.location) {
      start.push(node.location.start.offset);
      end.push(node.location.end.offset);
    }
    if (node.fieldLocation) {
      start.push(node.fieldLocation.start.offset);
      end.push(node.fieldLocation.end.offset);
    }
    if (node.termLocation) {
      start.push(node.termLocation.start.offset);
      end.push(node.termLocation.end.offset);
    }

    if (start.length === 0 || end.length === 0) {
      return;
    }

    return [start.reduce((a, b) => Math.min(a, b)), end.reduce((a, b) => Math.max(a, b))];
  },

  getDefaultOptions() {
    return {};
  },

};
