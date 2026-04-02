type AppState = import('../types').AppState;

const storage = window.localStorage;
const key = 'explorerSettingsV1';
const noop = () => {};

export const writeState: (state: Record<string, unknown>) => void = storage ?
  state => {
    try {
      storage.setItem(key, JSON.stringify(state));
    } catch(e) {
      // eslint-disable-next-line no-console
      console.warn('Unable to write to local storage.');
    }
  } :
  noop;

export const readState: () => AppState | undefined = storage ?
  () => {
    try {
      const state = storage.getItem(key);
      if (state) {
        return (JSON.parse(state) as AppState);
      }
    } catch(e) {
      // eslint-disable-next-line no-console
      console.warn('Unable to read from local storage.');
    }
  } :
  (noop as () => AppState | undefined);
