import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'shift-parser/package.json';

const ID = 'shift';

/** @type {Map<unknown, {start: {offset: number}, end: {offset: number}}> | undefined} */
let lastParsedLocations;

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc']),

  loadParser(/** @type {(realParser: {parseModuleWithLocation: (code: string, options: Record<string, unknown>) => {tree: unknown, locations: Map<unknown, {start: {offset: number}, end: {offset: number}}>}, parseScriptWithLocation: (code: string, options: Record<string, unknown>) => {tree: unknown, locations: Map<unknown, {start: {offset: number}, end: {offset: number}}>}, [key: string]: unknown}) => void} */ callback) {
    require(['shift-parser'], callback);
  },

  parse(/** @type {{parseModuleWithLocation: (code: string, options: Record<string, unknown>) => {tree: unknown, locations: Map<unknown, {start: {offset: number}, end: {offset: number}}>}, parseScriptWithLocation: (code: string, options: Record<string, unknown>) => {tree: unknown, locations: Map<unknown, {start: {offset: number}, end: {offset: number}}>}, [key: string]: unknown}} */ shift, code: string, options: Record<string, unknown>) {
    const parseMethod = options.sourceType === 'module' ?
      'parseModuleWithLocation' :
      'parseScriptWithLocation';
    const { tree, locations } = shift[parseMethod](code, options);
    lastParsedLocations = locations;
    return tree;
  },

  nodeToRange(node: Record<string, unknown>) {
    if (lastParsedLocations && lastParsedLocations.has(node)) {
      let loc = lastParsedLocations.get(node);
      return [loc.start.offset, loc.end.offset];
    }
  },

  opensByDefault(node: Record<string, unknown>, key: string) {
    return (
      key === 'items' ||
      key === 'declaration' ||
      key === 'declarators' ||
      key === 'statements' ||
      key === 'expression' ||
      key === 'body'
    );
  },

  getDefaultOptions() {
    return {
      earlyErrors: false,
      sourceType: 'module',
    };
  },

  _getSettingsConfiguration() {
    return {
      fields: [
        ['sourceType', ['script', 'module']],
        'earlyErrors',
      ],
    };
  },

};
