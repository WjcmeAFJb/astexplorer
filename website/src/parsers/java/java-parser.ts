import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'java-parser/package.json';
import type { CstNode as JavaNode } from 'java-parser';

type JavaParserModule = typeof import('java-parser');

const ID = 'java-parser';

export const parserSettingsConfiguration = {
    fields: [] as string[],
};

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage:
    pkg.homepage ||
    'https://github.com/jhipster/prettier-java/tree/master/packages/java-parser',

  locationProps: new Set(['location']),
  typeProps: new Set(['name']),

  loadParser(callback: (realParser: JavaParserModule) => void) {
    require(['java-parser'], callback);
  },

  parse(parser: typeof import('java-parser'), code: string) {
    return parser.parse(code);
  },

  _ignoredProperties: new Set(['tokenType']),

  getDefaultOptions() {
    return {};
  },

  getNodeName({ name }: {name?: string}) {
    return name;
  },

  nodeToRange({ location }: {location?: import('java-parser').CstNode['location']}) {
    if (!location) {
      return;
    }
    return [location.startOffset, location.endOffset + 1];
  },
};
