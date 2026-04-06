import type { AppState } from '../types';

const storage = window.localStorage;
const key = 'explorerSettingsV1';
const noop = () => {};
const noopRead = (): AppState | undefined => undefined;

function isAppState(value: unknown): value is AppState {
  return typeof value === 'object' && value !== null;
}

export const writeState: (state: Record<string, unknown>) => void =
  storage !== null && storage !== undefined
    ? (state) => {
        try {
          storage.setItem(key, JSON.stringify(state));
        } catch {
          // eslint-disable-next-line no-console
          console.warn('Unable to write to local storage.');
        }
      }
    : noop;

export const readState: () => AppState | undefined =
  storage !== null && storage !== undefined
    ? () => {
        try {
          const state = storage.getItem(key);
          if (state !== null && state !== '') {
            const parsed: unknown = JSON.parse(state);
            if (isAppState(parsed)) {
              return parsed;
            }
          }
        } catch {
          // eslint-disable-next-line no-console
          console.warn('Unable to read from local storage.');
        }
      }
    : noopRead;
