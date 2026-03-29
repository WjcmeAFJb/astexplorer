import React from 'react'; // eslint-disable-line no-unused-vars
import defaultParserInterface from './utils/defaultESTreeParserInterface';
import pkg from 'recast/package.json';

import flowParser, * as flowSettings from './flow';
import babylon6Parser, * as babylon6Settings from './babylon6';
import babylon7Parser, * as babylon7Settings from './babylon7';

const ID = 'recast';

/**
 * @typedef {{parse: (code: string, options?: Record<string, unknown>) => Record<string, unknown>, [key: string]: unknown}} RecastSubParser
 * @typedef {{recast: {parse: (code: string, options?: Record<string, unknown>) => Record<string, unknown>}, parsers: Record<string, RecastSubParser>}} RecastBundle
 */

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['range', 'loc', 'start', 'end']),

  loadParser(/** @type {(realParser: RecastBundle) => void} */ callback) {
    require(
      ['recast', 'babel5', 'babylon6', 'babylon7', 'flow-parser', 'recast/parsers/typescript'],
      (/** @type {{parse: (code: string, options?: Record<string, unknown>) => Record<string, unknown>}} */ recast, /** @type {RecastSubParser} */ babelCore, /** @type {RecastSubParser} */ babylon6, /** @type {RecastSubParser} */ babylon7, /** @type {RecastSubParser} */ flow, /** @type {RecastSubParser} */ typescript) => {
        callback({
          recast,
          parsers: {
            'babel5': babelCore,
            babylon6,
            babylon7,
            flow,
            typescript,
          },
        });
      },
    );
  },

  parse(/** @type {RecastBundle} */ { recast, parsers }, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    options = {...options}; // a copy is needed since we are mutating options
    const flowOptions = /** @type {Record<string, unknown>} */ (options.flow);
    const babylon6Options = /** @type {Record<string, unknown>} */ (options.babylon6);
    const babylon7Options = /** @type {Record<string, unknown>} */ (options.babylon7);
    delete options.flow;
    delete options.babylon6;
    delete options.babylon7;

    switch (options.parser) {
      case 'flow':
        options.parser = {
          parse(/** @type {string} */ code) {
            return flowParser.parse(parsers.flow, code, flowOptions);
          },
        };
        break;
      case 'babylon6':
        options.parser = {
          parse(/** @type {string} */ code) {
            return babylon6Parser.parse(parsers.babylon6, code, babylon6Options);
          },
        };
        break;
      case 'babylon7':
        options.parser = {
          parse(/** @type {string} */ code) {
            return babylon7Parser.parse(parsers.babylon7, code, babylon7Options);
          },
        };
        break;
      case 'babel5':
        options.parser = parsers[options.parser];
        break;
      case 'typescript':
        options.parser = parsers.typescript;
        break
      default:
        delete options.parser; // default parser
        break;
    }
    return recast.parse(code, options);
  },

  _ignoredProperties: new Set(['__clone']),

  *forEachProperty(/** @type {Record<string, unknown>} */ node) {
    if (node && typeof node === 'object') {
      for (let prop in node) {
        if (
          this._ignoredProperties.has(prop) || typeof node[prop] === 'function'
        ) {
          continue;
        }
        yield {
          value: node[prop],
          key: prop,
          computed: false,
        };
      }
    }
  },

  nodeToRange(/** @type {{start?: number, end?: number, range?: [number, number], [key: string]: unknown}} */ node) {
    if (typeof node.start === 'number') {
      return [node.start, node.end];
    }
    return node.range;
  },

  getDefaultOptions() {
    return {
      tolerant: false,
      range: true,
      parser: 'esprima',
      flow: flowSettings.defaultOptions,
      babylon6: babylon6Settings.defaultOptions,
      babylon7: babylon7Settings.defaultOptions,
    };
  },

  _getSettingsConfiguration(/** @type {Record<string, unknown>} */ defaultOptions) {
    return {
      fields: [
        ['parser', ['esprima', 'babel5', 'babylon6', 'babylon7', 'flow', 'typescript']],
        'range',
        'tolerant',
        {
          key: 'flow',
          title: 'Flow Settings',
          fields: flowSettings.parserSettingsConfiguration.fields,
          settings: (/** @type {Record<string, unknown>} */ settings) => settings.flow || defaultOptions.flow,
        },
        {
          key: 'babylon6',
          title: 'Babylon 6 Settings',
          fields: babylon6Settings.parserSettingsConfiguration.fields,
          settings: (/** @type {Record<string, unknown>} */ settings) => settings.babylon6 || defaultOptions.babylon6,
        },
        {
          key: 'babylon7',
          title: 'Babylon 7 Settings',
          fields: babylon7Settings.parserSettingsConfiguration.fields,
          settings: (/** @type {Record<string, unknown>} */ settings) => settings.babylon7 || defaultOptions.babylon7,
        },
      ],
      required: new Set(['range']),
    };
  },

};
