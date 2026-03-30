import React from 'react';
import defaultParserInterface from './utils/defaultESTreeParserInterface';
import pkg from '@swc/wasm-web/package.json';
// Webpack is configured to resolve this to a file path which is loaded
// dynamically below.
import wasm_bg from '@swc/wasm-web/wasm_bg.wasm';

const ID = 'swc';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: `${pkg.version}`,
  homepage: pkg.repository.url,
  locationProps: new Set(['range', 'loc', 'start', 'end']),

  loadParser(/** @type {(realParser: typeof import('@swc/wasm-web')) => void} */ callback) {
    require(['@swc/wasm-web/wasm.js'], (/** @type {typeof import('@swc/wasm-web')} */ instance) => {
      instance.default(wasm_bg).then(() => {
        callback(instance)
      });
    });
  },

  parse(/** @type {typeof import('@swc/wasm-web')} */ parsers, /** @type {string} */ code, /** @type {import('@swc/wasm-web').ParseOptions} */ options = /** @type {import('@swc/wasm-web').ParseOptions} */ ({})) {
    try {
      return parsers.parseSync(code, /** @type {import('@swc/wasm-web').ParseOptions} */ ({...this.getDefaultOptions(), ...options}));
    } catch (message) {
      throw new SyntaxError(/** @type {string} */ (message));
    }
  },

  nodeToRange(/** @type {{span?: {start: number, end: number}, [key: string]: unknown}} */ node) {
    if (node && node.span && typeof node.span.start === 'number') {
      return [node.span.start, node.span.end];
    }
  },

  getNodeName(/** @type {{type?: string, [key: string]: unknown}} */ node) {
    return node.type;
  },

  getDefaultOptions() {
    return {
      syntax: "ecmascript",
      jsx: false
    };
  },

  _getSettingsConfiguration() {
    return {
      fields: [
        ['syntax', ['typescript', 'ecmascript']],
        'jsx',
        'tsx',
        'dynamicImport',
        'privateMethod',
        'functionBind',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'decorators',
        'decoratorsBeforeExport',
        'topLevelAwait',
        'importMeta'
      ],
    };
  },

  renderSettings(/** @type {Record<string, unknown>} */ parserSettings, /** @type {(settings: Record<string, unknown>) => void} */ onChange) {
    return (
      <div>
        <p>
          <a
            href="https://swc.rs/docs/configuration/compilation#jscparser"
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
