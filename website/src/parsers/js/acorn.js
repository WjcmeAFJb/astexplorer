import React from 'react';
import defaultParserInterface from './utils/defaultESTreeParserInterface';
import pkg from 'acorn/package.json';

const ID = 'acorn';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: `${pkg.version}`,
  homepage: pkg.homepage,
  locationProps: new Set(['range', 'loc', 'start', 'end']),

  loadParser(/** @type {(realParser: {acorn: typeof import('acorn'), acornLoose: {parse: typeof import('acorn').parse}, acornJsx: () => (BaseParser: typeof import('acorn').Parser) => typeof import('acorn').Parser}) => void} */ callback) {
    require(['acorn', 'acorn-loose', 'acorn-jsx'], (/** @type {typeof import('acorn')} */ acorn, /** @type {{parse: typeof import('acorn').parse}} */ acornLoose, /** @type {() => (BaseParser: typeof import('acorn').Parser) => typeof import('acorn').Parser} */ acornJsx) => {
      callback({
        acorn,
        acornLoose,
        acornJsx,
      });
    });
  },

  parse(/** @type {{acorn: typeof import('acorn'), acornLoose: {parse: typeof import('acorn').parse}, acornJsx: () => (BaseParser: typeof import('acorn').Parser) => typeof import('acorn').Parser}} */ parsers, /** @type {string} */ code, options={}) {
    if (Object.keys(options).length === 0) {
      options = this.getDefaultOptions();
    }
    let parser;
    // @ts-expect-error — indexing dynamic object
    if (options['plugins.jsx'] && !options.loose) {
      const cls = parsers.acorn.Parser.extend(parsers.acornJsx());
      parser = cls.parse.bind(cls);
    } else {
      // @ts-expect-error — dynamic third-party API
      parser = options.loose ?
        parsers.acornLoose.parse:
        parsers.acorn.parse;
    }

    return parser(code, {
      ...options,
      // Replace `false` with `null` to use the default value calculated from ecmaVersion.
      // @ts-expect-error — dynamic third-party API
      allowAwaitOutsideFunction: options.allowAwaitOutsideFunction || null,
    });
  },

  nodeToRange(/** @type {{start?: number, end?: number, [key: string]: unknown}} */ node) {
    if (typeof node.start === 'number') {
      return [node.start, node.end];
    }
  },

  getDefaultOptions() {
    return {
      ecmaVersion: 'latest',
      sourceType: 'module',
      allowReserved: false,
      allowReturnOutsideFunction: false,
      allowImportExportEverywhere: false,
      allowAwaitOutsideFunction: false,
      allowHashBang: false,
      locations: false,
      loose: false,
      ranges: false,
      preserveParens: false,
      'plugins.jsx': true,
    };
  },

  _getSettingsConfiguration() {
    return {
      fields: [
        ['ecmaVersion', [3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 'latest'], (/** @type {string} */ x) => x === 'latest' ? x : Number(x)],
        ['sourceType', ['script', 'module']],
        'allowReserved',
        'allowReturnOutsideFunction',
        'allowImportExportEverywhere',
        'allowAwaitOutsideFunction',
        'allowHashBang',
        'locations',
        'loose',
        'ranges',
        'preserveParens',
        'plugins.jsx',
      ],
    };
  },

  renderSettings(/** @type {Record<string, unknown>} */ parserSettings, /** @type {(settings: Record<string, unknown>) => void} */ onChange) {
    return (
      <div>
        <p>
          <a
            href="https://github.com/acornjs/acorn/blob/master/acorn/src/options.js"
            target="_blank" rel="noopener noreferrer">
            Option descriptions
          </a>
        </p>
        {defaultParserInterface.renderSettings.call(
          this,
          parserSettings,
          onChange,
        )}
      </div>
    );
  },
};
