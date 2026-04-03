/**
 * @vitest-environment happy-dom
 *
 * Tests for website/src/codemirrorModes.ts
 * The ensureCMMode function lazily loads CodeMirror language modes and
 * caches them so they are only loaded once.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// We need to mock all the codemirror mode imports since they rely on
// the codemirror library being available.
// ---------------------------------------------------------------------------
vi.mock('codemirror/mode/css/css', () => ({ default: {} }));
vi.mock('codemirror/mode/go/go', () => ({ default: {} }));
vi.mock('codemirror/mode/handlebars/handlebars', () => ({ default: {} }));
vi.mock('codemirror/mode/htmlmixed/htmlmixed', () => ({ default: {} }));
vi.mock('codemirror/mode/javascript/javascript', () => ({ default: {} }));
vi.mock('codemirror/mode/lua/lua', () => ({ default: {} }));
vi.mock('codemirror/mode/markdown/markdown', () => ({ default: {} }));
vi.mock('codemirror/mode/mllike/mllike', () => ({ default: {} }));
vi.mock('codemirror/mode/php/php', () => ({ default: {} }));
vi.mock('codemirror/mode/protobuf/protobuf', () => ({ default: {} }));
vi.mock('codemirror/mode/pug/pug', () => ({ default: {} }));
vi.mock('codemirror/mode/python/python', () => ({ default: {} }));
vi.mock('codemirror/mode/rust/rust', () => ({ default: {} }));
vi.mock('codemirror/mode/sql/sql', () => ({ default: {} }));
vi.mock('codemirror/mode/vue/vue', () => ({ default: {} }));
vi.mock('codemirror/mode/webidl/webidl', () => ({ default: {} }));
vi.mock('codemirror/mode/yaml/yaml', () => ({ default: {} }));
vi.mock('codemirror/mode/clike/clike', () => ({ default: {} }));
vi.mock('codemirror/mode/xml/xml', () => ({ default: {} }));

// We need a fresh module for each test to reset the `loaded` Set
beforeEach(() => {
  vi.resetModules();
});

describe('ensureCMMode', () => {
  test('resolves immediately for undefined mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode(undefined)).resolves.toBeUndefined();
  });

  test('resolves immediately for empty string mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('')).resolves.toBeUndefined();
  });

  test('resolves for unknown mode name (no loader registered)', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    // A mode that is not in the modeLoaders map should resolve silently
    await expect(ensureCMMode('nonexistent-mode')).resolves.toBeUndefined();
  });

  test('loads a known mode (javascript)', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('javascript')).resolves.toBeUndefined();
  });

  test('loads css mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('css')).resolves.toBeUndefined();
  });

  test('loads python mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('python')).resolves.toBeUndefined();
  });

  test('loads go mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('go')).resolves.toBeUndefined();
  });

  test('loads rust mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('rust')).resolves.toBeUndefined();
  });

  test('loads yaml mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('yaml')).resolves.toBeUndefined();
  });

  test('loads clike mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('clike')).resolves.toBeUndefined();
  });

  test('loads text/css mode (alias for css)', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('text/css')).resolves.toBeUndefined();
  });

  test('loads text/x-ocaml mode (alias for mllike)', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('text/x-ocaml')).resolves.toBeUndefined();
  });

  test('loads text/x-java mode (alias for clike)', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('text/x-java')).resolves.toBeUndefined();
  });

  test('loads text/x-scala mode (alias for clike)', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('text/x-scala')).resolves.toBeUndefined();
  });

  test('caches loaded mode (does not re-import)', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    // First load
    await ensureCMMode('javascript');
    // Second load should resolve immediately without re-importing
    const start = performance.now();
    await ensureCMMode('javascript');
    const elapsed = performance.now() - start;
    // Should be very fast since it's cached
    expect(elapsed).toBeLessThan(100);
  });

  test('accepts object with name property', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode({ name: 'javascript' })).resolves.toBeUndefined();
  });

  test('accepts object with name for unknown mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode({ name: 'unknown-xyz' })).resolves.toBeUndefined();
  });

  test('caches by name string, not by object identity', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await ensureCMMode('python');
    // Loading again with an object should hit cache
    await expect(ensureCMMode({ name: 'python' })).resolves.toBeUndefined();
  });

  test('loads multiple distinct modes', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await ensureCMMode('javascript');
    await ensureCMMode('css');
    await ensureCMMode('python');
    // All should have loaded without error
    // Loading them again should be cached
    await expect(ensureCMMode('javascript')).resolves.toBeUndefined();
    await expect(ensureCMMode('css')).resolves.toBeUndefined();
    await expect(ensureCMMode('python')).resolves.toBeUndefined();
  });

  test('loads xml mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('xml')).resolves.toBeUndefined();
  });

  test('loads htmlmixed mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('htmlmixed')).resolves.toBeUndefined();
  });

  test('loads sql mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('sql')).resolves.toBeUndefined();
  });

  test('loads lua mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('lua')).resolves.toBeUndefined();
  });

  test('loads markdown mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('markdown')).resolves.toBeUndefined();
  });

  test('loads pug mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('pug')).resolves.toBeUndefined();
  });

  test('loads php mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('php')).resolves.toBeUndefined();
  });

  test('loads handlebars mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('handlebars')).resolves.toBeUndefined();
  });

  test('loads protobuf mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('protobuf')).resolves.toBeUndefined();
  });

  test('loads vue mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('vue')).resolves.toBeUndefined();
  });

  test('loads webidl mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('webidl')).resolves.toBeUndefined();
  });

  test('loads mllike mode', async () => {
    const { ensureCMMode } = await import('../src/codemirrorModes');
    await expect(ensureCMMode('mllike')).resolves.toBeUndefined();
  });
});
