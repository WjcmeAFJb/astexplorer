import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'java-parser/package.json';

type JavaNode = { name?: string, location?: { startOffset?: number, endOffset?: number }, [key: string]: unknown };
type JavaParserModule = { parse: (code: string, options?: Record<string, unknown>) => JavaNode, [key: string]: unknown };

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

  parse(parser: JavaParserModule, code: string) {
    return parser.parse(code);
  },

  _ignoredProperties: new Set(['tokenType']),

  getDefaultOptions() {
    return {};
  },

  getNodeName({ name }: {name?: string}) {
    return name;
  },

  nodeToRange({ location }: {location?: JavaNode['location']}) {
    if (!location) {
      return;
    }
    return [location.startOffset, location.endOffset + 1];
  },
};
