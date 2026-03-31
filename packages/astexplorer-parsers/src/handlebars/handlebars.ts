import defaultParserInterface from './utils/defaultHandlebarsParserInterface';
import pkg from 'handlebars/package.json';

const ID = 'handlebars';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  loadParser(callback: (realParser: typeof import('handlebars').parse) => void) {
    require(['handlebars'], (handlebars: typeof import('handlebars')) => callback(handlebars.parse));
  },

  opensByDefault(node: ReturnType<typeof import('handlebars').parse>, key: string) {
    return key === 'body';
  },
};
