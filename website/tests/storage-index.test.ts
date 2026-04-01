/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import StorageHandler from '../src/storage/index';

function makeBackend(overrides: Record<string, any> = {}) {
  return {
    owns: vi.fn(() => false),
    matchesURL: vi.fn(() => false),
    fetchFromURL: vi.fn(() => Promise.resolve(null)),
    create: vi.fn(() => Promise.resolve({ id: 'new' })),
    update: vi.fn(() => Promise.resolve({ id: 'updated' })),
    fork: vi.fn(() => Promise.resolve({ id: 'forked' })),
    ...overrides,
  };
}

describe('StorageHandler', () => {
  beforeEach(() => {
    global.location.hash = '';
  });

  test('fetchFromURL returns null for empty hash', async () => {
    const handler = new StorageHandler([makeBackend()] as any);
    expect(await handler.fetchFromURL()).toBeNull();
  });

  test('fetchFromURL returns null for root hash', async () => {
    global.location.hash = '#/';
    const handler = new StorageHandler([makeBackend()] as any);
    expect(await handler.fetchFromURL()).toBeNull();
  });

  test('fetchFromURL delegates to matching backend', async () => {
    const rev = { getPath: () => '/abc' };
    const backend = makeBackend({ matchesURL: () => true, fetchFromURL: () => Promise.resolve(rev) });
    global.location.hash = '#/abc/123';
    const handler = new StorageHandler([backend] as any);
    expect(await handler.fetchFromURL()).toBe(rev);
  });

  test('fetchFromURL rejects for unknown URL format', async () => {
    global.location.hash = '#/unknown/format';
    const handler = new StorageHandler([makeBackend()] as any);
    await expect(handler.fetchFromURL()).rejects.toThrow('Unknown URL format');
  });

  test('fetchFromURL tries backends in order', async () => {
    const b1 = makeBackend({ matchesURL: () => false });
    const b2 = makeBackend({ matchesURL: () => true, fetchFromURL: () => Promise.resolve({ id: 'found' }) });
    global.location.hash = '#/something';
    const handler = new StorageHandler([b1, b2] as any);
    const result = await handler.fetchFromURL();
    expect(result).toEqual({ id: 'found' });
    expect(b1.fetchFromURL).not.toHaveBeenCalled();
  });

  test('create delegates to first backend', async () => {
    const b1 = makeBackend();
    const handler = new StorageHandler([b1, makeBackend()] as any);
    await handler.create({ code: 'x' } as any);
    expect(b1.create).toHaveBeenCalledWith({ code: 'x' });
  });

  test('update delegates to first backend', async () => {
    const b1 = makeBackend();
    const handler = new StorageHandler([b1] as any);
    const rev = { id: 'r1' };
    await handler.update(rev as any, { code: 'y' } as any);
    expect(b1.update).toHaveBeenCalledWith(rev, { code: 'y' });
  });

  test('fork delegates to first backend', async () => {
    const b1 = makeBackend();
    const handler = new StorageHandler([b1] as any);
    const rev = { id: 'r1' };
    await handler.fork(rev as any, { code: 'z' } as any);
    expect(b1.fork).toHaveBeenCalledWith(rev, { code: 'z' });
  });

  test('updateHash sets location hash from revision path', () => {
    const handler = new StorageHandler([makeBackend()] as any);
    handler.updateHash({ getPath: () => '/gist/abc/def' } as any);
    expect(global.location.hash).toContain('/gist/abc/def');
  });

  test('_owns returns backend that owns the revision', () => {
    const b1 = makeBackend({ owns: () => false });
    const b2 = makeBackend({ owns: () => true });
    const handler = new StorageHandler([b1, b2] as any);
    expect((handler as any)._owns({}) ).toBe(b2);
  });

  test('_owns returns null when no backend owns revision', () => {
    const handler = new StorageHandler([makeBackend()] as any);
    expect((handler as any)._owns({})).toBeNull();
  });
});
