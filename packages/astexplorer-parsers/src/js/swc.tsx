import React from 'react';
import defaultParserInterface from './utils/defaultESTreeParserInterface';
import pkg from '@swc/wasm-web/package.json';

const ID = 'swc';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: `${pkg.version}`,
  homepage: pkg.repository.url,
  locationProps: new Set(['range', 'loc', 'start', 'end']),

  loadParser(callback: (realParser: typeof import('@swc/wasm-web')) => void) {
    require(['@swc/wasm-web/wasm.js', '@swc/wasm-web/wasm_bg.wasm'], (instance: typeof import('@swc/wasm-web'), wasmModule: {default: string} | string) => {
      const wasm = typeof wasmModule === 'string' ? wasmModule : wasmModule.default;
      instance.default(wasm).then(() => {
        callback(instance)
      });
    });
  },

  parse(parsers: typeof import('@swc/wasm-web'), code: string, options: import('@swc/wasm-web').ParseOptions = ({} as import('@swc/wasm-web').ParseOptions)) {
    try {
      return parsers.parseSync(code, ({...this.getDefaultOptions(), ...options} as import('@swc/wasm-web').ParseOptions));
    } catch (message) {
      throw new SyntaxError((message as string));
    }
  },

  nodeToRange(node: {span?: {start: number, end: number}, [key: string]: unknown}) {
    if (node && node.span && typeof node.span.start === 'number') {
      return [node.span.start, node.span.end];
    }
  },

  getNodeName(node: {type?: string, [key: string]: unknown}) {
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

  renderSettings(parserSettings: Record<string, unknown>, onChange: (settings: Record<string, unknown>) => void) {
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
