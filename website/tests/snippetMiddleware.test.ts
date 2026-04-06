/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('astexplorer-parsers', () => ({
  getParserByID: (id: string) => ({
    id,
    version: '1.0.0',
    category: { id: 'javascript', fileExtension: 'js' },
  }),
  getTransformerByID: (id: string) => (id ? { id, version: '2.0.0' } : undefined),
}));

import snippetMiddleware from '../src/store/snippetMiddleware';

function makeState(overrides: Record<string, any> = {}) {
  return {
    workbench: {
      parser: 'acorn',
      parserSettings: { ecmaVersion: 2020 },
      code: 'const x = 1;',
      initialCode: 'const x = 1;',
      keyMap: 'default',
      parseResult: undefined,
      transform: {
        transformer: '',
        code: 'export default function(fileInfo) {}',
        initialCode: '',
        transformResult: null,
      },
    },
    showTransformPanel: false,
    activeRevision: null,
    enableFormatting: false,
    saving: false,
    forking: false,
    ...overrides,
  };
}

describe('snippetMiddleware', () => {
  let storageAdapter: any;
  let store: any;
  let next: ReturnType<typeof vi.fn>;
  let state: any;

  beforeEach(() => {
    storageAdapter = {
      fetchFromURL: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      fork: vi.fn(),
      updateHash: vi.fn(),
    };
    state = makeState();
    store = { getState: vi.fn(() => state) };
    next = vi.fn();
    // Reset hash
    window.location.hash = '';
  });

  test('passes through default/unknown actions', () => {
    const middleware = snippetMiddleware(storageAdapter)(store)(next);
    const action = { type: 'SOME_OTHER_ACTION', data: 123 };
    const result = middleware(action);
    expect(next).toHaveBeenCalledWith(action);
    expect(result).toBe(next.mock.results[0].value);
  });

  // ---- CLEAR_ERROR ----

  test('CLEAR_ERROR passes through to next', () => {
    const middleware = snippetMiddleware(storageAdapter)(store)(next);
    middleware({ type: 'CLEAR_ERROR' });
    expect(next).toHaveBeenCalledWith({ type: 'CLEAR_ERROR' });
  });

  test('CLEAR_ERROR clears URL hash when clearURLOnClearError flag is set', async () => {
    // To set the clearURLOnClearError flag, we need a failed load
    storageAdapter.fetchFromURL.mockRejectedValue(new Error('Network error'));
    const middleware = snippetMiddleware(storageAdapter)(store)(next);

    // Trigger a failed load to set clearURLOnClearError
    await middleware({ type: 'LOAD_SNIPPET' });

    // Now set hash to simulate a URL
    window.location.hash = '#/some/snippet';

    // CLEAR_ERROR should clear the hash
    middleware({ type: 'CLEAR_ERROR' });
    expect(window.location.hash).toBe('');
  });

  test('CLEAR_ERROR does not clear URL hash when flag is not set', () => {
    window.location.hash = '#/some/snippet';
    const middleware = snippetMiddleware(storageAdapter)(store)(next);
    middleware({ type: 'CLEAR_ERROR' });
    // hash should remain unchanged
    expect(window.location.hash).toBe('#/some/snippet');
    window.location.hash = '';
  });

  // ---- LOAD_SNIPPET ----

  test('LOAD_SNIPPET loads snippet successfully with revision', async () => {
    const revision = { id: 'abc', getCode: () => 'code' };
    storageAdapter.fetchFromURL.mockResolvedValue(revision);
    const middleware = snippetMiddleware(storageAdapter)(store)(next);

    await middleware({ type: 'LOAD_SNIPPET' });

    // Should dispatch: setError(null), startLoadingSnippet, setSnippet, doneLoadingSnippet
    const types = next.mock.calls.map((c: any[]) => c[0]?.type || c[0]);
    expect(types).toContain('SET_ERROR');
    expect(types).toContain('START_LOADING_SNIPPET');
    expect(types).toContain('SET_SNIPPET');
    expect(types).toContain('DONE_LOADING_SNIPPET');

    // setSnippet should have the revision
    const setSnippetCall = next.mock.calls.find((c: any[]) => c[0]?.type === 'SET_SNIPPET');
    expect(setSnippetCall[0].revision).toBe(revision);
  });

  test('LOAD_SNIPPET clears snippet when fetchFromURL returns null', async () => {
    storageAdapter.fetchFromURL.mockResolvedValue(null);
    const middleware = snippetMiddleware(storageAdapter)(store)(next);

    await middleware({ type: 'LOAD_SNIPPET' });

    const types = next.mock.calls.map((c: any[]) => c[0]?.type);
    expect(types).toContain('CLEAR_SNIPPET');
    expect(types).not.toContain('SET_SNIPPET');
  });

  test('LOAD_SNIPPET sets error on fetch failure', async () => {
    storageAdapter.fetchFromURL.mockRejectedValue(new Error('404 Not Found'));
    const middleware = snippetMiddleware(storageAdapter)(store)(next);

    await middleware({ type: 'LOAD_SNIPPET' });

    const errorCall = next.mock.calls.find((c: any[]) => c[0]?.type === 'SET_ERROR' && c[0]?.error);
    expect(errorCall).toBeTruthy();
    expect(errorCall[0].error.message).toContain('Failed to fetch revision');
    expect(errorCall[0].error.message).toContain('404 Not Found');

    // doneLoadingSnippet should always be called
    const doneCall = next.mock.calls.find((c: any[]) => c[0]?.type === 'DONE_LOADING_SNIPPET');
    expect(doneCall).toBeTruthy();
  });

  test('LOAD_SNIPPET skips when isSaving is true', async () => {
    state.saving = true;
    const middleware = snippetMiddleware(storageAdapter)(store)(next);

    await middleware({ type: 'LOAD_SNIPPET' });

    expect(storageAdapter.fetchFromURL).not.toHaveBeenCalled();
  });

  test('LOAD_SNIPPET skips when isForking is true', async () => {
    state.forking = true;
    const middleware = snippetMiddleware(storageAdapter)(store)(next);

    await middleware({ type: 'LOAD_SNIPPET' });

    expect(storageAdapter.fetchFromURL).not.toHaveBeenCalled();
  });

  test('LOAD_SNIPPET cancels previous load when new load starts', async () => {
    // First load will be slow
    let resolveFirst: (v: any) => void;
    const firstPromise = new Promise((r) => (resolveFirst = r));
    storageAdapter.fetchFromURL.mockReturnValueOnce(firstPromise);

    const middleware = snippetMiddleware(storageAdapter)(store)(next);

    // Start first load (don't await)
    const firstLoad = middleware({ type: 'LOAD_SNIPPET' });

    // Second load (will cancel first)
    const secondRevision = { id: 'second' };
    storageAdapter.fetchFromURL.mockResolvedValue(secondRevision);
    const secondLoad = middleware({ type: 'LOAD_SNIPPET' });

    // Now resolve the first load
    resolveFirst({ id: 'first' });
    await firstLoad;
    await secondLoad;

    // SET_SNIPPET should be called with the second revision, not the first
    const setSnippetCalls = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_SNIPPET');
    // Only second load should produce a SET_SNIPPET
    expect(setSnippetCalls.length).toBe(1);
    expect(setSnippetCalls[0][0].revision).toBe(secondRevision);
  });

  // ---- SAVE ----

  test('SAVE creates new snippet when no active revision', async () => {
    const newRevision = { id: 'new123' };
    storageAdapter.create.mockResolvedValue(newRevision);
    const middleware = snippetMiddleware(storageAdapter)(store)(next);

    middleware({ type: 'SAVE', fork: false });

    // Should dispatch START_SAVE immediately
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ type: 'START_SAVE', fork: false }));

    // Wait for async save
    await vi.waitFor(() => {
      expect(storageAdapter.create).toHaveBeenCalled();
    });

    // Wait for END_SAVE
    await vi.waitFor(() => {
      const endSaveCalls = next.mock.calls.filter((c: any[]) => c[0]?.type === 'END_SAVE');
      expect(endSaveCalls.length).toBe(1);
    });

    expect(storageAdapter.updateHash).toHaveBeenCalledWith(newRevision);
  });

  test('SAVE updates existing revision when active revision exists', async () => {
    const activeRevision = { id: 'existing' };
    state.activeRevision = activeRevision;
    const updatedRevision = { id: 'updated' };
    storageAdapter.update.mockResolvedValue(updatedRevision);
    const middleware = snippetMiddleware(storageAdapter)(store)(next);

    middleware({ type: 'SAVE', fork: false });

    await vi.waitFor(() => {
      expect(storageAdapter.update).toHaveBeenCalledWith(activeRevision, expect.any(Object));
    });

    await vi.waitFor(() => {
      expect(storageAdapter.updateHash).toHaveBeenCalledWith(updatedRevision);
    });
  });

  test('SAVE forks when fork=true', async () => {
    const activeRevision = { id: 'existing' };
    state.activeRevision = activeRevision;
    const forkedRevision = { id: 'forked' };
    storageAdapter.fork.mockResolvedValue(forkedRevision);
    const middleware = snippetMiddleware(storageAdapter)(store)(next);

    middleware({ type: 'SAVE', fork: true });

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ type: 'START_SAVE', fork: true }));

    await vi.waitFor(() => {
      expect(storageAdapter.fork).toHaveBeenCalledWith(activeRevision, expect.any(Object));
    });

    await vi.waitFor(() => {
      expect(storageAdapter.updateHash).toHaveBeenCalledWith(forkedRevision);
    });
  });

  test('SAVE includes transform data when transform panel is shown', async () => {
    state.showTransformPanel = true;
    state.workbench.transform.transformer = 'jscodeshift';
    storageAdapter.create.mockResolvedValue({ id: 'new' });
    const middleware = snippetMiddleware(storageAdapter)(store)(next);

    middleware({ type: 'SAVE', fork: false });

    await vi.waitFor(() => {
      expect(storageAdapter.create).toHaveBeenCalled();
    });

    const savedData = storageAdapter.create.mock.calls[0][0];
    expect(savedData.toolID).toBe('jscodeshift');
    expect(savedData.transform).toBe('export default function(fileInfo) {}');
  });

  test('SAVE does not include transform data when transform panel is hidden', async () => {
    state.showTransformPanel = false;
    storageAdapter.create.mockResolvedValue({ id: 'new' });
    const middleware = snippetMiddleware(storageAdapter)(store)(next);

    middleware({ type: 'SAVE', fork: false });

    await vi.waitFor(() => {
      expect(storageAdapter.create).toHaveBeenCalled();
    });

    const savedData = storageAdapter.create.mock.calls[0][0];
    expect(savedData.toolID).toBeUndefined();
    expect(savedData.transform).toBeUndefined();
  });

  test('SAVE sets error on save failure', async () => {
    const saveError = new Error('Save failed');
    storageAdapter.create.mockRejectedValue(saveError);
    const middleware = snippetMiddleware(storageAdapter)(store)(next);

    middleware({ type: 'SAVE', fork: false });

    await vi.waitFor(() => {
      const errorCalls = next.mock.calls.filter(
        (c: any[]) => c[0]?.type === 'SET_ERROR' && c[0]?.error,
      );
      expect(errorCalls.length).toBe(1);
      expect(errorCalls[0][0].error).toBe(saveError);
    });
  });

  test('SAVE does not call updateHash when newRevision is null', async () => {
    storageAdapter.create.mockResolvedValue(null);
    const middleware = snippetMiddleware(storageAdapter)(store)(next);

    middleware({ type: 'SAVE', fork: false });

    await vi.waitFor(() => {
      const endSaveCalls = next.mock.calls.filter((c: any[]) => c[0]?.type === 'END_SAVE');
      expect(endSaveCalls.length).toBe(1);
    });

    expect(storageAdapter.updateHash).not.toHaveBeenCalled();
  });

  test('SAVE includes correct snippet data fields', async () => {
    storageAdapter.create.mockResolvedValue({ id: 'new' });
    const middleware = snippetMiddleware(storageAdapter)(store)(next);

    middleware({ type: 'SAVE', fork: false });

    await vi.waitFor(() => {
      expect(storageAdapter.create).toHaveBeenCalled();
    });

    const data = storageAdapter.create.mock.calls[0][0];
    expect(data.parserID).toBe('acorn');
    expect(data.settings).toEqual({ acorn: { ecmaVersion: 2020 } });
    expect(data.versions).toEqual({ acorn: '1.0.0' });
    expect(data.filename).toBe('source.js');
    expect(data.code).toBe('const x = 1;');
  });

  test('SAVE does not return a value (breaks out of switch)', () => {
    storageAdapter.create.mockResolvedValue({ id: 'new' });
    const middleware = snippetMiddleware(storageAdapter)(store)(next);

    const result = middleware({ type: 'SAVE', fork: false });
    expect(result).toBeUndefined();
  });

  test('LOAD_SNIPPET resets clearURLOnClearError flag', async () => {
    // First: cause an error to set clearURLOnClearError = true
    storageAdapter.fetchFromURL.mockRejectedValueOnce(new Error('fail'));
    const middleware = snippetMiddleware(storageAdapter)(store)(next);
    await middleware({ type: 'LOAD_SNIPPET' });

    // Now trigger a successful load (resets the flag)
    storageAdapter.fetchFromURL.mockResolvedValueOnce(null);
    await middleware({ type: 'LOAD_SNIPPET' });

    // CLEAR_ERROR should NOT clear hash now
    window.location.hash = '#/test';
    middleware({ type: 'CLEAR_ERROR' });
    // The flag was reset by the second LOAD_SNIPPET, so hash should remain
    expect(window.location.hash).toBe('#/test');
    window.location.hash = '';
  });
});
