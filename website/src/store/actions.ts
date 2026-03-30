import type { Revision } from '../types';
import type { Category } from '../types';
import type { Transformer } from '../types';
import type { Parser } from '../types';

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

export function setParser(parser: Parser): {type: typeof SET_PARSER, parser: Parser} {
  return {type: SET_PARSER, parser};
}

export function setParserSettings(settings: Record<string, unknown>): {type: typeof SET_PARSER_SETTINGS, settings: Record<string, unknown>} {
  return {type: SET_PARSER_SETTINGS, settings};
}

export function save(fork?: boolean): {type: typeof SAVE, fork: boolean} {
  return {type: SAVE, fork};
}

export function startSave(fork: boolean): {type: typeof START_SAVE, fork: boolean} {
  return {type: START_SAVE, fork};
}

export function endSave(fork: boolean): {type: typeof END_SAVE, fork: boolean} {
  return {type: END_SAVE, fork};
}

export function setSnippet(revision: Revision): {type: typeof SET_SNIPPET, revision: Revision} {
  return {type: SET_SNIPPET, revision};
}

export function selectCategory(category: Category): {type: typeof SELECT_CATEGORY, category: Category} {
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

export function setError(error: Error | null): {type: typeof SET_ERROR, error: Error | null} {
  return {type: SET_ERROR, error};
}

/** @returns {{type: typeof CLEAR_ERROR}} */
export function clearError() {
  return {type: CLEAR_ERROR};
}

export function selectTransformer(transformer: Transformer): {type: typeof SELECT_TRANSFORMER, transformer: Transformer} {
  return {type: SELECT_TRANSFORMER, transformer};
}

/** @returns {{type: typeof HIDE_TRANSFORMER}} */
export function hideTransformer() {
  return {type: HIDE_TRANSFORMER};
}

export function setTransformState(state: any): {type: typeof SET_TRANSFORM, code: string, cursor?: number} {
  return {type: SET_TRANSFORM, ...state};
}

export function setCode(state: any): {type: typeof SET_CODE, code: string, cursor?: number} {
  return {type: SET_CODE, ...state};
}

export function setCursor(cursor: number): {type: typeof SET_CURSOR, cursor: number} {
  return {type: SET_CURSOR, cursor};
}

export function dropText(text: string, categoryId: string): {type: typeof DROP_TEXT, text: string, categoryId: string} {
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

export function setKeyMap(keyMap: string): {type: typeof SET_KEY_MAP, keyMap: string} {
  return {type: SET_KEY_MAP, keyMap}
}
