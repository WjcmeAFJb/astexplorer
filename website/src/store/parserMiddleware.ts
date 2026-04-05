// oxlint-disable max-lines-per-function, typescript-eslint/no-unsafe-argument, typescript-eslint/no-unsafe-assignment, typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-member-access, typescript-eslint/prefer-nullish-coalescing, typescript-eslint/strict-boolean-expressions -- middleware functions are necessarily large state-coordination units; legacy untyped code
import {getParser, getParserSettings, getCode} from './selectors';
import {ignoreKeysFilter, locationInformationFilter, functionFilter, emptyKeysFilter, typeKeysFilter} from '../core/TreeAdapter';
import type {Parser} from '../types';

function parse(parser: Parser, code: string, parserSettings: Record<string, unknown> | null): Promise<unknown> {
  if (!parser._promise) {
    parser._promise = new Promise(parser.loadParser);
  }
  return parser._promise.then(
    realParser => parser.parse(
      realParser,
      code,
      parserSettings ?? parser.getDefaultOptions(),
    ),
  );
}

export default (store: any) => (next: any) => (action: any) => { // oxlint-disable-line typescript-eslint(no-explicit-any) -- Redux middleware signature requires any for store/next/action compatibility
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
            openByDefault: (newParser.opensByDefault || (() => false)).bind(newParser),
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
            // oxlint-disable-next-line unicorn/no-null -- ParseResult type uses null to indicate "no error"
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
            // oxlint-disable-next-line unicorn/no-null -- ParseResult type uses null for error cases
            time: null,
            // oxlint-disable-next-line unicorn/no-null -- ParseResult type uses null for error cases
            ast: null,
            // oxlint-disable-next-line unicorn/no-null -- ParseResult type uses null for error cases
            treeAdapter: null,
            error,
          },
        });
      },
    );
  }

};
