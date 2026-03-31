import defaultParserInterface from './utils/defaultHandlebarsParserInterface';
import pkg from 'ember-template-recast/package.json';

const ID = 'ember-template-recast';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  loadParser(callback: (realParser: typeof import('ember-template-recast').parse) => void) {
    require(['ember-template-recast'], (recast: typeof import('ember-template-recast')) => callback(recast.parse));
  },

  opensByDefault(node: import('@glimmer/syntax').ASTv1.Node, key: string) {
    return key === 'body';
  },
};
