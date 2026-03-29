/** @typedef {{type: string, start?: number, end?: number, range?: [number, number], loc?: {start: {line: number, column: number}, end: {line: number, column: number}}, [key: string]: unknown}} ESTreeNode */

import defaultParserInterface from './utils/defaultESTreeParserInterface';
// NOTE: We load the hermes-parser package in a worker and not directly, because
// it violates the typical limit on the size of a WebAssembly module that can be
// compiled synchronously on the main thread.
import HermesWorkerClient from './hermes/HermesWorkerClient';
import pkg from 'hermes-parser/package.json';

export const defaultOptions = {
  sourceType: 'unambiguous',
  flow: 'detect',
  allowReturnOutsideFunction: false,
  babel: false,
  tokens: false,
};

export const parserSettingsConfiguration = {
  fields: [
    ['sourceType', ['unambiguous', 'module', 'script']],
    ['flow', ['detect', 'all']],
    'allowReturnOutsideFunction',
    'babel',
    'tokens',
  ],
};

export default {
  ...defaultParserInterface,

  id: 'hermes',
  displayName: pkg.name,
  version: pkg.version,
  homepage: pkg.homepage || 'https://hermesengine.dev/',
  locationProps: new Set(['range', 'loc', 'start', 'end']),

  loadParser(/** @type {(realParser: HermesWorkerClient) => void} */ callback) {
    callback(new HermesWorkerClient());
  },

  async parse(/** @type {HermesWorkerClient} */ hermes, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    return await hermes.parse(code, options);
  },

  nodeToRange(/** @type {ESTreeNode} */ node) {
    // For `babel: true` mode
    if (typeof node.start !== 'undefined') {
      return [node.start, node.end];
    }
    // For `babel: false` mode
    return node.range;
  },  

  getDefaultOptions() {
    return defaultOptions;
  },

  _getSettingsConfiguration() {
    return parserSettingsConfiguration;
  },
};
