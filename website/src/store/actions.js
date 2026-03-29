/** @typedef {import('../types.js').Parser} Parser */
/** @typedef {import('../types.js').Transformer} Transformer */
/** @typedef {import('../types.js').Category} Category */
/** @typedef {import('../types.js').Revision} Revision */

export const SET_ERROR = 'SET_ERROR';
export const CLEAR_ERROR = 'CLEAR_ERROR';
export const LOAD_SNIPPET = 'LOAD_SNIPPET';
export const START_LOADING_SNIPPET = 'START_LOADING_SNIPPET';
export const DONE_LOADING_SNIPPET = 'DONE_LOADING_SNIPPET';
export const CLEAR_SNIPPET = 'CLEAR_SNIPPET';
export const SELECT_CATEGORY = 'CHANGE_CATEGORY';
export const SELECT_TRANSFORMER = 'SELECT_TRANSFORMER';
export const HIDE_TRANSFORMER = 'HIDE_TRANSFORMER';
export const SET_TRANSFORM = 'SET_TRANSFORM';
export const SET_TRANSFORM_RESULT = 'SET_TRANSFORM_RESULT';
export const SET_PARSER = 'SET_PARSER';
export const SET_PARSER_SETTINGS = 'SET_PARSER_SETTINGS';
export const SET_PARSE_RESULT = 'SET_PARSE_RESULT';
export const SET_SNIPPET = 'SET_SNIPPET';
export const OPEN_SETTINGS_DIALOG = 'OPEN_SETTINGS_DIALOG';
export const CLOSE_SETTINGS_DIALOG = 'CLOSE_SETTINGS_DIALOG';
export const EXPAND_SETTINGS_DRAWER = 'EXPAND_SETTINGS_DRAWER';
export const COLLAPSE_SETTINGS_DRAWER = 'COLLAPSE_SETTINGS_DRAWER';
export const OPEN_SHARE_DIALOG = 'OPEN_SHARE_DIALOG';
export const CLOSE_SHARE_DIALOG = 'CLOSE_SHARE_DIALOG';
export const SET_CODE = 'SET_CODE';
export const SET_CURSOR = 'SET_CURSOR';
export const DROP_TEXT = 'DROP_TEXT';
export const SAVE = 'SAVE';
export const START_SAVE = 'START_SAVE';
export const END_SAVE = 'END_SAVE';
export const RESET = 'RESET';
export const TOGGLE_FORMATTING = 'TOGGLE_FORMATTING';
export const SET_KEY_MAP = 'SET_KEY_MAP';

/**
 * @param {Parser} parser
 * @returns {{type: typeof SET_PARSER, parser: Parser}}
 */
export function setParser(parser) {
  return {type: SET_PARSER, parser};
}

/**
 * @param {Record<string, unknown>} settings
 * @returns {{type: typeof SET_PARSER_SETTINGS, settings: Record<string, unknown>}}
 */
export function setParserSettings(settings) {
  return {type: SET_PARSER_SETTINGS, settings};
}

/**
 * @param {boolean} [fork=false]
 * @returns {{type: typeof SAVE, fork: boolean}}
 */
export function save(fork=false) {
  return {type: SAVE, fork};
}

/**
 * @param {boolean} fork
 * @returns {{type: typeof START_SAVE, fork: boolean}}
 */
export function startSave(fork) {
  return {type: START_SAVE, fork};
}

/**
 * @param {boolean} fork
 * @returns {{type: typeof END_SAVE, fork: boolean}}
 */
export function endSave(fork) {
  return {type: END_SAVE, fork};
}

/**
 * @param {Revision} revision
 * @returns {{type: typeof SET_SNIPPET, revision: Revision}}
 */
export function setSnippet(revision) {
  return {type: SET_SNIPPET, revision};
}

/**
 * @param {Category} category
 * @returns {{type: typeof SELECT_CATEGORY, category: Category}}
 */
export function selectCategory(category) {
  return {type: SELECT_CATEGORY, category};
}

/** @returns {{type: typeof CLEAR_SNIPPET}} */
export function clearSnippet() {
  return {type: CLEAR_SNIPPET};
}

/** @returns {{type: typeof START_LOADING_SNIPPET}} */
export function startLoadingSnippet() {
  return {type: START_LOADING_SNIPPET};
}

/** @returns {{type: typeof DONE_LOADING_SNIPPET}} */
export function doneLoadingSnippet() {
  return {type: DONE_LOADING_SNIPPET};
}

/** @returns {{type: typeof LOAD_SNIPPET}} */
export function loadSnippet() {
  return {type: LOAD_SNIPPET};
}

/** @returns {{type: typeof OPEN_SETTINGS_DIALOG}} */
export function openSettingsDialog() {
  return {type: OPEN_SETTINGS_DIALOG};
}

/** @returns {{type: typeof CLOSE_SETTINGS_DIALOG}} */
export function closeSettingsDialog() {
  return {type: CLOSE_SETTINGS_DIALOG};
}

/** @returns {{type: typeof EXPAND_SETTINGS_DRAWER}} */
export function expandSettingsDrawer() {
  return {type: EXPAND_SETTINGS_DRAWER};
}

/** @returns {{type: typeof COLLAPSE_SETTINGS_DRAWER}} */
export function collapseSettingsDrawer() {
  return {type: COLLAPSE_SETTINGS_DRAWER};
}

/** @returns {{type: typeof OPEN_SHARE_DIALOG}} */
export function openShareDialog() {
  return {type: OPEN_SHARE_DIALOG};
}

/** @returns {{type: typeof CLOSE_SHARE_DIALOG}} */
export function closeShareDialog() {
  return {type: CLOSE_SHARE_DIALOG};
}

/**
 * @param {Error | null} error
 * @returns {{type: typeof SET_ERROR, error: Error | null}}
 */
export function setError(error) {
  return {type: SET_ERROR, error};
}

/** @returns {{type: typeof CLEAR_ERROR}} */
export function clearError() {
  return {type: CLEAR_ERROR};
}

/**
 * @param {Transformer} transformer
 * @returns {{type: typeof SELECT_TRANSFORMER, transformer: Transformer}}
 */
export function selectTransformer(transformer) {
  return {type: SELECT_TRANSFORMER, transformer};
}

/** @returns {{type: typeof HIDE_TRANSFORMER}} */
export function hideTransformer() {
  return {type: HIDE_TRANSFORMER};
}

/**
 * @param {{code: string, cursor?: number}} state
 * @returns {{type: typeof SET_TRANSFORM, code: string, cursor?: number}}
 */
export function setTransformState(state) {
  return {type: SET_TRANSFORM, ...state};
}

/**
 * @param {{code: string, cursor?: number}} state
 * @returns {{type: typeof SET_CODE, code: string, cursor?: number}}
 */
export function setCode(state) {
  return {type: SET_CODE, ...state};
}

/**
 * @param {number} cursor
 * @returns {{type: typeof SET_CURSOR, cursor: number}}
 */
export function setCursor(cursor) {
  return {type: SET_CURSOR, cursor};
}

/**
 * @param {string} text
 * @param {string} categoryId
 * @returns {{type: typeof DROP_TEXT, text: string, categoryId: string}}
 */
export function dropText(text, categoryId) {
  return {type: DROP_TEXT, text, categoryId};
}

/** @returns {{type: typeof RESET}} */
export function reset() {
  return {type: RESET};
}

/** @returns {{type: typeof TOGGLE_FORMATTING}} */
export function toggleFormatting() {
  return {type: TOGGLE_FORMATTING};
}

/**
 * @param {string} keyMap
 * @returns {{type: typeof SET_KEY_MAP, keyMap: string}}
 */
export function setKeyMap(keyMap) {
  return {type: SET_KEY_MAP, keyMap}
}
