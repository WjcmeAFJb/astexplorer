import React from 'react'; // eslint-disable-line no-unused-vars
import defaultParserInterface from './utils/defaultESTreeParserInterface';
import pkg from 'recast/package.json';

import flowParser, * as flowSettings from './flow';
import babylon6Parser, * as babylon6Settings from './babylon6';
import babylon7Parser, * as babylon7Settings from './babylon7';

const ID = 'recast';

type RecastSubParser = {parse: (code: string, options?: Record<string, unknown>) => Record<string, unknown>, [key: string]: unknown};
type RecastBundle = {recast: Pick<typeof import('recast'), 'parse'>, parsers: Record<string, RecastSubParser>};

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['range', 'loc', 'start', 'end']),

  loadParser(callback: (realParser: RecastBundle) => void) {
    require(
      ['recast', 'babel5', 'babylon6', 'babylon7', 'flow-parser', 'recast/parsers/typescript'],
      (recast: {parse: (code: string, options?: Record<string, unknown>) => Record<string, unknown>}, babelCore: RecastSubParser, babylon6: RecastSubParser, babylon7: RecastSubParser, flow: RecastSubParser, typescript: RecastSubParser) => {
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

  parse({ recast, parsers }: RecastBundle, code: string, options: Record<string, unknown>) {
    options = {...options}; // a copy is needed since we are mutating options
    const flowOptions = (options.flow as Record<string, unknown>);
    const babylon6Options = (options.babylon6 as Record<string, unknown>);
    const babylon7Options = (options.babylon7 as Record<string, unknown>);
    delete options.flow;
    delete options.babylon6;
    delete options.babylon7;

    switch (options.parser) {
      case 'flow':
        options.parser = {
          parse(code: string) {
            return flowParser.parse(parsers.flow, code, flowOptions);
          },
        };
        break;
      case 'babylon6':
        options.parser = {
          parse(code: string) {
            return babylon6Parser.parse(parsers.babylon6, code, babylon6Options);
          },
        };
        break;
      case 'babylon7':
        options.parser = {
          parse(code: string) {
            return babylon7Parser.parse(((parsers.babylon7 as unknown) as typeof import('babylon7')), code, babylon7Options);
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
    // oxlint-disable-next-line typescript-eslint(no-unsafe-return) -- recast.parse() is typed as returning any in its .d.ts
    return recast.parse(code, options);
  },

  _ignoredProperties: new Set(['__clone']),

  *forEachProperty(node: Record<string, unknown>) {
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

  nodeToRange(node: {start?: number, end?: number, range?: [number, number], [key: string]: unknown}) {
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

  _getSettingsConfiguration(defaultOptions: Record<string, unknown>) {
    return {
      fields: [
        ['parser', ['esprima', 'babel5', 'babylon6', 'babylon7', 'flow', 'typescript']],
        'range',
        'tolerant',
        {
          key: 'flow',
          title: 'Flow Settings',
          fields: flowSettings.parserSettingsConfiguration.fields,
          settings: (settings: Record<string, unknown>) => settings.flow || defaultOptions.flow,
        },
        {
          key: 'babylon6',
          title: 'Babylon 6 Settings',
          fields: babylon6Settings.parserSettingsConfiguration.fields,
          settings: (settings: Record<string, unknown>) => settings.babylon6 || defaultOptions.babylon6,
        },
        {
          key: 'babylon7',
          title: 'Babylon 7 Settings',
          fields: babylon7Settings.parserSettingsConfiguration.fields,
          settings: (settings: Record<string, unknown>) => settings.babylon7 || defaultOptions.babylon7,
        },
      ],
      required: new Set(['range']),
    };
  },

};
