/** @typedef {import('../types.js').AppState} AppState */
/** @typedef {import('../types.js').Parser} Parser */
/** @typedef {import('../types.js').Transformer} Transformer */
/** @typedef {import('../types.js').Revision} Revision */
/** @typedef {import('../types.js').ParseResult} ParseResult */
/** @typedef {import('../types.js').TransformResult} TransformResult */

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
  (/** @type {string} */ code, /** @type {string} */ initialCode) => code !== initialCode,
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
  (/** @type {string} */ code, /** @type {string} */ initialCode) => code !== initialCode,
);

/** @type {(state: AppState) => boolean} */
export const canFork = createSelector(
  [getRevision],
  (/** @type {Revision | null | undefined} */ revision) => !!revision,
);

/** @type {(state: AppState) => boolean} */
const canSaveCode = createSelector(
  [getRevision, isCodeDirty],
  (/** @type {Revision | null | undefined} */ revision, /** @type {boolean} */ dirty) => (
    !revision || // can always save if there is no revision
    dirty
  ),
);

/** @type {(state: AppState) => boolean} */
export const canSaveTransform = createSelector(
  [showTransformer, isTransformDirty],
  (/** @type {boolean} */ showTransformer, /** @type {boolean} */ dirty) => showTransformer && dirty,
);

/** @type {(state: AppState) => boolean} */
const didParserSettingsChange = createSelector(
  [getParserSettings, getRevision, getParser],
  (/** @type {Record<string, unknown> | null} */ parserSettings, /** @type {Revision | null | undefined} */ revision, /** @type {Parser} */ parser) => {
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
  (/** @type {Revision | null | undefined} */ revision, /** @type {boolean} */ canSaveCode, /** @type {boolean} */ canSaveTransform, /** @type {boolean} */ didParserSettingsChange) => (
    (canSaveCode || canSaveTransform || didParserSettingsChange) &&
    (!revision || revision.canSave())
  ),
);
