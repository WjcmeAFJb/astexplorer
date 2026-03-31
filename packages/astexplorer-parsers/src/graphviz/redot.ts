import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'redot/package.json';

type RedotParser = ((options?: object) => { parse(code: string): RedotNode }) & Record<string, unknown>;
type RedotNode = { position?: { start: { offset: number }, end: { offset: number } }, children?: RedotNode[], [key: string]: unknown };

const ID = 'redot';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['position']),

  loadParser(callback: (realParser: RedotParser) => void) {
    require(['redot'], callback);
  },

  parse(redot: RedotParser, code: string) {
    return redot().parse(code);
  },

  nodeToRange({ position }: RedotNode) {
    if (position) {
      return [position.start.offset, position.end.offset];
    }
  },

  opensByDefault(node: Record<string, unknown>, key: string) {
    return key === 'children';
  },
};
