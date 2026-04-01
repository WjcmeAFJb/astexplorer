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

  test('writeState handles storage errors gracefully', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('quota exceeded'); };
    expect(() => writeState({ x: 1 })).not.toThrow();
    Storage.prototype.setItem = orig;
    spy.mockRestore();
  });

  test('readState handles parse errors gracefully', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('explorerSettingsV1', '{invalid json');
    expect(readState()).toBeUndefined();
    spy.mockRestore();
  });
});
