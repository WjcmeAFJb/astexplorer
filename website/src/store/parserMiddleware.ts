/** @typedef {import('../types').Parser} Parser */
/** @typedef {import('../types').ParseResult} ParseResult */
/** @typedef {import('../types').TreeFilter} TreeFilter */

import {getParser, getParserSettings, getCode} from './selectors';
import {ignoreKeysFilter, locationInformationFilter, functionFilter, emptyKeysFilter, typeKeysFilter} from '../core/TreeAdapter';

/**
 * @param {Parser} parser
 * @param {string} code
 * @param {Record<string, unknown> | null} parserSettings
 * @returns {Promise<unknown>}
 */
function parse(parser, code, parserSettings) {
  if (!parser._promise) {
    parser._promise = new Promise(parser.loadParser);
  }
  return parser._promise.then(
    realParser => parser.parse(
      realParser,
      code,
      parserSettings || parser.getDefaultOptions(),
    ),
  );
}

/** @type {(store: import('redux').MiddlewareAPI<import('redux').Dispatch, import('../types').AppState>) => (next: import('redux').Dispatch) => (action: import('../types').Action) => unknown} */
export default store => next => action => {
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
    if (!newParser || newCode == null) {
      return;
    }
    const start = Date.now();
    return parse(newParser, newCode, newParserSettings).then(
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
      /** @param {Error} error */ error => {
        console.error(error); // eslint-disable-line no-console
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
