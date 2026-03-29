import defaultParserInterface from './utils/defaultESTreeParserInterface';
import pkg from 'babylon5/package.json';

const ID = 'babylon';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc', 'start', 'end']),
  showInMenu: false,

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['babylon5'], callback);
  },

  parse(/** @type {DynModule} */ babylon, /** @type {string} */ code, /** @type {Record<string, unknown>} */ parserSettings) {
    return babylon.parse(code, parserSettings);
  },

  getNodeName(/** @type {ASTNode} */ node) {
    switch (typeof node.type) {
      case 'string':
        return node.type;
      case 'object':
        return `Token (${node.type.label})`;
    }
  },

  nodeToRange(/** @type {ASTNode} */ node) {
    if (typeof node.start !== 'undefined') {
      return [node.start, node.end];
    }
  },

  getDefaultOptions() {
    return {
      sourceType: 'module',
      allowReserved: false,
      allowReturnOutsideFunction: false,
      strictMode: false,
      tokens: false,

      features: {
        'es7.asyncFunctions': true,
        'es7.classProperties': true,
        'es7.comprehensions': true,
        'es7.decorators': true,
        'es7.exportExtensions': true,
        'es7.functionBind': true,
        'es7.objectRestSpread': true,
        'es7.trailingFunctionCommas': true,
      },

      plugins: { jsx: true, flow: true },
    };
  },

  _getSettingsConfiguration(/** @type {Record<string, unknown>} */ defaultOptions) {
    return {
      fields: [
        ['sourceType', ['module', 'script']],
        'allowReserved',
        'allowReturnOutsideFunction',
        'strictMode',
        'tokens',
        {
          key: 'features',
          title: 'Features',
          fields: Object.keys(defaultOptions.features),
          settings: (/** @type {Record<string, unknown>} */ settings) => settings.features || {.../** @type {Record<string, unknown>} */ (defaultOptions.features)},
        },
        {
          key: 'plugins',
          title: 'Plugins',
          fields: Object.keys(defaultOptions.plugins),
          settings: (/** @type {Record<string, unknown>} */ settings) => settings.plugins || {.../** @type {Record<string, unknown>} */ (defaultOptions.plugins)},
          values: (/** @type {ASTNode} */ plugins) => Object.keys(defaultOptions.plugins).reduce(
            // @ts-expect-error — indexing dynamic object
            (obj, name) => ((obj[name] = name in plugins), obj),
            {},
          ),
          update: (/** @type {ASTNode} */ plugins, /** @type {string} */ name, /** @type {ASTNodeValue} */ value) => {
            if (value) {
              return {...plugins, [name]: true};
            }
            plugins = {...plugins};
            delete plugins[name];
            return plugins;
          },
        },
      ],
    };
  },

  _ignoredProperties: new Set([
    '__clone',
  ]),

};
