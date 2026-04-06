import { getParser, getParserSettings, getCode } from './selectors';
import {
  ignoreKeysFilter,
  locationInformationFilter,
  functionFilter,
  emptyKeysFilter,
  typeKeysFilter,
} from '../core/TreeAdapter';
import type { Parser, AppState, Action, WalkResult } from '../types';
import type { MiddlewareAPI, Dispatch } from 'redux';

function parse(
  parser: Parser,
  code: string,
  parserSettings: Record<string, unknown> | null,
): Promise<unknown> {
  parser._promise ??= new Promise(parser.loadParser);
  return parser._promise.then((realParser) =>
    parser.parse(realParser, code, parserSettings ?? parser.getDefaultOptions()),
  );
}

export default (store: MiddlewareAPI<Dispatch, AppState>) =>
  (next: Dispatch) =>
  async (action: Action) => {
    const oldState = store.getState();
    next(action);
    const newState = store.getState();

    const newParser = getParser(newState);
    const newParserSettings = getParserSettings(newState);
    const newCode = getCode(newState);

    if (
      action.type === 'INIT' ||
      getParser(oldState) !== newParser ||
      getParserSettings(oldState) !== newParserSettings ||
      getCode(oldState) !== newCode
    ) {
      if (
        newParser === undefined ||
        newParser === null ||
        newCode === null ||
        newCode === undefined
      ) {
        return;
      }
      const start = Date.now();
      try {
        const ast = await parse(newParser, newCode, newParserSettings);
        // Did anything change in the meantime?
        if (
          newParser !== getParser(store.getState()) ||
          newParserSettings !== getParserSettings(store.getState()) ||
          newCode !== getCode(store.getState())
        ) {
          return;
        }
        // Temporary adapter for parsers that haven't been migrated yet.
        const openByDefault: (node: unknown, key: string) => boolean = (
          node: unknown,
          key: string,
        ) => (newParser.opensByDefault ?? (() => false))(node, key);
        const nodeToRange: (node: unknown) => [number, number] | null = (node: unknown) =>
          newParser.nodeToRange(node) ?? null;
        const nodeToName: (node: unknown) => string = (node: unknown) =>
          newParser.getNodeName(node) ?? '';
        const walkNode: (node: unknown) => Iterable<WalkResult> = (node: unknown) =>
          newParser.forEachProperty(node);
        const treeAdapter = {
          type: 'default',
          options: {
            openByDefault,
            nodeToRange,
            nodeToName,
            walkNode,
            filters: [
              ignoreKeysFilter(newParser._ignoredProperties),
              functionFilter(),
              emptyKeysFilter(),
              locationInformationFilter(newParser.locationProps),
              typeKeysFilter(newParser.typeProps),
            ],
            locationProps: newParser.locationProps,
          },
        };
        next({
          type: 'SET_PARSE_RESULT',
          result: {
            time: Date.now() - start,
            ast: ast,
            error: null,
            treeAdapter,
          },
        });
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(err); // eslint-disable-line no-console
        next({
          type: 'SET_PARSE_RESULT',
          result: {
            time: null,
            ast: null,
            treeAdapter: null,
            error: err,
          },
        });
      }
    }
  };
