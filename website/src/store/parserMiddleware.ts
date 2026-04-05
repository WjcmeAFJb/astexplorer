import {getParser, getParserSettings, getCode} from './selectors';
import {ignoreKeysFilter, locationInformationFilter, functionFilter, emptyKeysFilter, typeKeysFilter} from '../core/TreeAdapter';
import type {Parser, AppState, Action} from '../types';
import type {MiddlewareAPI, Dispatch} from 'redux';

function parse(parser: Parser, code: string, parserSettings: Record<string, unknown> | null): Promise<unknown> {
  parser._promise ??= new Promise(parser.loadParser);
  return parser._promise.then(
    realParser => parser.parse(
      realParser,
      code,
      parserSettings ?? parser.getDefaultOptions(),
    ),
  );
}

// oxlint-disable-next-line max-lines-per-function -- Redux middleware orchestrates multiple async operations
export default (store: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
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
    // oxlint-disable-next-line typescript-eslint(strict-boolean-expressions) -- runtime guard: parser/code may be null at runtime despite types (e.g. rehydrated from storage)
    if (!newParser || newCode === null || newCode === undefined) {
      return;
    }
    const start = Date.now();
    return parse(newParser, newCode, newParserSettings).then(
      // oxlint-disable-next-line promise/always-return -- middleware dispatches side effects; no meaningful return value
      ast => {
        // Did anything change in the meantime?
        if (
          newParser !== getParser(store.getState()) ||
          newParserSettings !== getParserSettings(store.getState()) ||
          newCode !== getCode(store.getState())
        ) {
          return;
        }
        // Temporary adapter for parsers that haven't been migrated yet.
        const treeAdapter = {
          type: 'default',
          options: {
            // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- .bind() returns any; TS limitation
            openByDefault: (newParser.opensByDefault ?? (() => false)).bind(newParser),
            // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- .bind() returns any; TS limitation
            nodeToRange: newParser.nodeToRange.bind(newParser),
            // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- .bind() returns any; TS limitation
            nodeToName: newParser.getNodeName.bind(newParser),
            // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- .bind() returns any; TS limitation
            walkNode: newParser.forEachProperty.bind(newParser),
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
        // oxlint-disable-next-line promise/no-callback-in-promise -- redux middleware must call next() inside promise callbacks
        next({
          type: 'SET_PARSE_RESULT',
          result: {
            time: Date.now() - start,
            ast: ast,
            error: null,
            treeAdapter,
          },
        });
      },
      (error: Error) => {
        console.error(error); // eslint-disable-line no-console
        // oxlint-disable-next-line promise/no-callback-in-promise -- redux middleware must call next() inside promise callbacks
        next({
          type: 'SET_PARSE_RESULT',
          result: {
            time: null,
            ast: null,
            treeAdapter: null,
            error,
          },
        });
      },
    );
  }

};
