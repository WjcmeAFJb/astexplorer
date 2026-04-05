import type {AppState} from '../types';

const storage = window.localStorage;
const key = 'explorerSettingsV1';
const noop = () => {};

export const writeState: (state: Record<string, unknown>) => void = storage !== null && storage !== undefined ?
  state => {
    try {
      storage.setItem(key, JSON.stringify(state));
    } catch {
      // eslint-disable-next-line no-console
      console.warn('Unable to write to local storage.');
    }
  } :
  noop;

export const readState: () => AppState | undefined = storage !== null && storage !== undefined ?
  () => {
    try {
      const state = storage.getItem(key);
      if (state !== null && state !== '') {
        const parsed: unknown = JSON.parse(state);
        if (typeof parsed === 'object' && parsed !== null) {
          // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- JSON.parse returns unknown; we validated it's a non-null object
          return parsed as AppState;
        }
      }
    } catch {
      // eslint-disable-next-line no-console
      console.warn('Unable to read from local storage.');
    }
  } :
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- noop returns undefined which is compatible with AppState | undefined
  (noop as () => AppState | undefined);
