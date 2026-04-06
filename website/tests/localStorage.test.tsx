/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

// happy-dom provides localStorage
describe('LocalStorage', () => {
  // Import dynamically so the module initializes with happy-dom's localStorage
  let writeState: any;
  let readState: any;

  beforeEach(async () => {
    localStorage.clear();
    // Re-import to get fresh module with localStorage available
    vi.resetModules();
    const mod = await import('../src/components/LocalStorage');
    writeState = mod.writeState;
    readState = mod.readState;
  });

  test('writeState stores JSON to localStorage', () => {
    writeState({ parser: 'acorn', code: 'x' });
    const stored = localStorage.getItem('explorerSettingsV1');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toEqual({ parser: 'acorn', code: 'x' });
  });

  test('readState returns parsed state', () => {
    localStorage.setItem('explorerSettingsV1', JSON.stringify({ parser: 'esprima' }));
    const state = readState();
    expect(state).toEqual({ parser: 'esprima' });
  });

  test('readState returns undefined when nothing stored', () => {
    expect(readState()).toBeUndefined();
  });

  test('writeState handles storage errors gracefully (lines 13-14)', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Make JSON.stringify throw to trigger the catch block
    const origStringify = JSON.stringify;
    JSON.stringify = () => {
      throw new Error('circular ref');
    };
    expect(() => writeState({ x: 1 })).not.toThrow();
    expect(spy).toHaveBeenCalledWith('Unable to write to local storage.');
    JSON.stringify = origStringify;
    spy.mockRestore();
  });

  test('readState handles parse errors gracefully', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('explorerSettingsV1', '{invalid json');
    expect(readState()).toBeUndefined();
    spy.mockRestore();
  });

  test('writeState writes and readState can read back', () => {
    const state = { keyMap: 'vim', parser: 'babel' };
    writeState(state);
    const result = readState();
    expect(result).toEqual(state);
  });

  test('writeState with complex nested state', () => {
    const state = {
      parser: 'acorn',
      settings: { ecmaVersion: 2020, jsx: true },
      nested: { deep: { value: 42 } },
    };
    writeState(state);
    const stored = localStorage.getItem('explorerSettingsV1');
    expect(JSON.parse(stored!)).toEqual(state);
  });

  test('readState returns undefined when storage has empty string', () => {
    localStorage.setItem('explorerSettingsV1', '');
    // Empty string is falsy, so readState returns undefined
    const result = readState();
    expect(result).toBeUndefined();
  });
});

describe('LocalStorage with no localStorage', () => {
  test('noop functions when localStorage is unavailable', async () => {
    // Save and restore original localStorage
    const origLocalStorage = window.localStorage;
    // Delete localStorage to simulate unavailable storage
    // We need to re-import the module after removing localStorage
    vi.resetModules();

    // Override window.localStorage to simulate it being unavailable
    Object.defineProperty(window, 'localStorage', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const mod = await import('../src/components/LocalStorage');
    // When storage is falsy, writeState and readState should be noops
    expect(() => mod.writeState({ x: 1 })).not.toThrow();
    expect(mod.readState()).toBeUndefined();

    // Restore
    Object.defineProperty(window, 'localStorage', {
      value: origLocalStorage,
      configurable: true,
      writable: true,
    });
  });
});
