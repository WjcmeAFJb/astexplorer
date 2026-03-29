import defaultParserInterface from './utils/defaultESTreeParserInterface';
import pkg from 'babylon6/package.json';

const availablePlugins = [
  'asyncGenerators',
  'classConstructorCall',
  'classProperties',
  'decorators',
  'doExpressions',
  'estree',
  'exportExtensions',
  'flow',
  'functionSent',
  'functionBind',
  'jsx',
  'objectRestSpread',
  'dynamicImport',
];

const ID = 'babylon6';
export const defaultOptions = {
  sourceType: 'module',
  allowImportExportEverywhere: false,
  allowReturnOutsideFunction: false,
  tokens: false,
  plugins: [
    'asyncGenerators',
    'classConstructorCall',
    'classProperties',
    'decorators',
    'doExpressions',
    'exportExtensions',
    'flow',
    'functionSent',
    'functionBind',
    'jsx',
    'objectRestSpread',
    'dynamicImport',
  ],
};

export const parserSettingsConfiguration = {
  fields: [
    ['sourceType', ['module', 'script']],
    'allowReturnOutsideFunction',
    'allowImportExportEverywhere',
    'tokens',
    {
      key: 'plugins',
      title: 'Plugins',
      fields: availablePlugins,
      settings: (/** @type {*} */ settings) => settings.plugins || defaultOptions.plugins,
      values: (/** @type {*} */ plugins) => availablePlugins.reduce(
        // @ts-expect-error — indexing dynamic object
        (obj, name) => ((obj[name] = plugins.indexOf(name) > -1), obj),
        {},
      ),
    },
  ],
};

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc', 'start', 'end']),
  showInMenu: false,

  loadParser(/** @type {*} */ callback) {
    require(['babylon6'], callback);
  },

  parse(/** @type {*} */ babylon, /** @type {*} */ code, /** @type {*} */ options) {
    return babylon.parse(code, options);
  },

  getNodeName(/** @type {*} */ node) {
    switch (typeof node.type) {
      case 'string':
        return node.type;
      case 'object':
        return `Token (${node.type.label})`;
    }
  },

  nodeToRange(/** @type {*} */ node) {
    if (typeof node.start !== 'undefined') {
      return [node.start, node.end];
    }
  },

  getDefaultOptions() {
    return defaultOptions;
  },

  _getSettingsConfiguration() {
    return parserSettingsConfiguration;
  },

};
