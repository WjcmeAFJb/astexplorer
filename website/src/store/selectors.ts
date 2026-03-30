/** @typedef {import('../types').AppState} AppState */
/** @typedef {import('../types').Parser} Parser */
/** @typedef {import('../types').Transformer} Transformer */
/** @typedef {import('../types').Revision} Revision */
/** @typedef {import('../types').ParseResult} ParseResult */
/** @typedef {import('../types').TransformResult} TransformResult */

import isEqual from 'lodash.isequal';
import {getParserByID, getTransformerByID} from '../parsers';

// Our selectors are not computationally expensive so we can just use this
// implementation.
// createSelector uses Function.apply which loses type information.
// Callback parameters are untyped (any) because they come from heterogeneous
// dependency return types. Each call site uses @type to declare the actual signature.
/**
 * @param {Array<(state: AppState) => unknown>} deps
 * @param {(...args: unknown[]) => unknown} f
 * @returns {(state: AppState) => *}
 */
function createSelector(deps, f) {
  return function(state) {
    // oxlint-disable-next-line typescript-eslint(no-unsafe-return) -- Function.apply returns any; TS limitation
    return f.apply(this, deps.map(d => d(state)));
  }
}

// UI related

/**
 * @param {AppState} state
 * @returns {boolean}
 */
export function getFormattingState(state) {
  return state.enableFormatting;
}

/**
 * @param {AppState} state
 * @returns {number | null}
 */
export function getCursor(state) {
  return state.cursor;
}

/**
 * @param {AppState} state
 * @returns {Error | null}
 */
export function getError(state) {
  return state.error;
}

/**
 * @param {AppState} state
 * @returns {boolean}
 */
export function isLoadingSnippet(state) {
  return state.loadingSnippet;
}

/**
 * @param {AppState} state
 * @returns {boolean}
 */
export function showSettingsDialog(state) {
  return state.showSettingsDialog;
}

/**
 * @param {AppState} state
 * @returns {boolean}
 */
export function showSettingsDrawer(state) {
  return state.showSettingsDrawer;
}

/**
 * @param {AppState} state
 * @returns {boolean}
 */
export function showShareDialog(state) {
  return state.showShareDialog;
}

/**
 * @param {AppState} state
 * @returns {boolean}
 */
export function isForking(state) {
  return state.forking;
}

/**
 * @param {AppState} state
 * @returns {boolean}
 */
export function isSaving(state) {
  return state.saving;
}

// Parser related

/**
 * @param {AppState} state
 * @returns {Parser}
 */
export function getParser(state) {
  return getParserByID(state.workbench.parser);
}

/**
 * @param {AppState} state
 * @returns {Record<string, unknown> | null}
 */
export function getParserSettings(state) {
  return state.workbench.parserSettings;
}

/**
 * @param {AppState} state
 * @returns {ParseResult | undefined}
 */
export function getParseResult(state) {
  return state.workbench.parseResult;
}

// Code related
/**
 * @param {AppState} state
 * @returns {Revision | null | undefined}
 */
export function getRevision(state) {
  return state.activeRevision;
}

/**
 * @param {AppState} state
 * @returns {string}
 */
export function getCode(state) {
  return state.workbench.code;
}

/**
 * @param {AppState} state
 * @returns {string}
 */
export function getInitialCode(state) {
  return state.workbench.initialCode;
}

/**
 * @param {AppState} state
 * @returns {string}
 */
export function getKeyMap (state) {
  return state.workbench.keyMap;
}


/** @type {(state: AppState) => boolean} */
const isCodeDirty = createSelector(
  [getCode, getInitialCode],
  (code: string, initialCode: string) => code !== initialCode,
);

// Transform related

/**
 * @param {AppState} state
 * @returns {string}
 */
export function getTransformCode(state) {
  return state.workbench.transform.code;
}

/**
 * @param {AppState} state
 * @returns {string}
 */
export function getInitialTransformCode(state) {
  return state.workbench.transform.initialCode;
}

/**
 * @param {AppState} state
 * @returns {Transformer | undefined}
 */
export function getTransformer(state) {
  return getTransformerByID(state.workbench.transform.transformer);
}

/**
 * @param {AppState} state
 * @returns {TransformResult | null}
 */
export function getTransformResult(state) {
  return state.workbench.transform.transformResult;
}

/**
 * @param {AppState} state
 * @returns {boolean}
 */
export function showTransformer(state) {
  return state.showTransformPanel;
}

/** @type {(state: AppState) => boolean} */
const isTransformDirty = createSelector(
  [getTransformCode, getInitialTransformCode],
  (code: string, initialCode: string) => code !== initialCode,
);

/** @type {(state: AppState) => boolean} */
export const canFork = createSelector(
  [getRevision],
  (revision: Revision | null | undefined) => !!revision,
);

/** @type {(state: AppState) => boolean} */
const canSaveCode = createSelector(
  [getRevision, isCodeDirty],
  (revision: Revision | null | undefined, dirty: boolean) => (
    !revision || // can always save if there is no revision
    dirty
  ),
);

/** @type {(state: AppState) => boolean} */
export const canSaveTransform = createSelector(
  [showTransformer, isTransformDirty],
  (showTransformer: boolean, dirty: boolean) => showTransformer && dirty,
);

/** @type {(state: AppState) => boolean} */
const didParserSettingsChange = createSelector(
  [getParserSettings, getRevision, getParser],
  (parserSettings: Record<string, unknown> | null, revision: Revision | null | undefined, parser: Parser) => {
    const savedParserSettings = revision && revision.getParserSettings();
    return (
      !!revision &&
      (
        parser.id !== revision.getParserID() ||
        !!savedParserSettings && !isEqual(parserSettings, savedParserSettings)
      )
    )

  },
);

/** @type {(state: AppState) => boolean} */
export const canSave = createSelector(
  [getRevision, canSaveCode, canSaveTransform, didParserSettingsChange],
  (revision: Revision | null | undefined, canSaveCode: boolean, canSaveTransform: boolean, didParserSettingsChange: boolean) => (
    (canSaveCode || canSaveTransform || didParserSettingsChange) &&
    (!revision || revision.canSave())
  ),
);
