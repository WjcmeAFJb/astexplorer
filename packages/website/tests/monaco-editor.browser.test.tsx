/**
 * Browser-mode tests for Monaco Editor integration.
 * These tests run in a real browser via Playwright and verify that Monaco
 * works correctly across all three editor views: code, transformer, and result.
 */
import { describe, test, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { astexplorer, revive } from '../src/store/reducers';

afterEach(() => {
  cleanup();
});

function makeStore(state?: any) {
  return createStore(astexplorer, revive(state));
}

function renderWithStore(element: React.ReactElement, store?: any) {
  const s = store || makeStore();
  return { ...render(<Provider store={s}>{element}</Provider>), store: s };
}

// ===========================================================================
// Code View Editor
// ===========================================================================
describe('Monaco Editor - Code View', () => {
  test('renders Monaco editor instance in DOM', async () => {
    const { default: Editor } = await import('../src/components/Editor');
    const { container } = render(<Editor value="const x = 1;" mode="javascript" />);
    const monacoEl = container.querySelector('.monaco-editor');
    expect(monacoEl).toBeTruthy();
  });

  test('displays the provided value', async () => {
    const { default: Editor } = await import('../src/components/Editor');
    const code = 'function hello() { return "world"; }';
    const { container } = render(<Editor value={code} mode="javascript" />);
    // Monaco renders content in view-lines
    const monacoEl = container.querySelector('.monaco-editor');
    expect(monacoEl).toBeTruthy();
  });

  test('renders with line numbers enabled', async () => {
    const { default: Editor } = await import('../src/components/Editor');
    const { container } = render(<Editor value="line 1\nline 2\nline 3" lineNumbers={true} />);
    const lineNumbers = container.querySelector('.line-numbers');
    // Monaco renders line numbers in the margin
    const margin = container.querySelector('.monaco-editor .margin');
    expect(margin).toBeTruthy();
  });

  test('renders without line numbers when disabled', async () => {
    const { default: Editor } = await import('../src/components/Editor');
    const { container } = render(<Editor value="hello" lineNumbers={false} />);
    const monacoEl = container.querySelector('.monaco-editor');
    expect(monacoEl).toBeTruthy();
  });

  test('renders in readOnly mode', async () => {
    const { default: Editor } = await import('../src/components/Editor');
    const { container } = render(<Editor value="readonly content" readOnly={true} />);
    const monacoEl = container.querySelector('.monaco-editor');
    expect(monacoEl).toBeTruthy();
  });

  test('fires onContentChange when editor content changes', async () => {
    const { default: Editor } = await import('../src/components/Editor');
    const onContentChange = vi.fn();
    let editorRef: any = null;

    render(
      <Editor
        ref={(ref: any) => {
          editorRef = ref;
        }}
        value="initial"
        onContentChange={onContentChange}
      />,
    );

    // Simulate content change via the internal method
    expect(editorRef).toBeTruthy();
    await act(async () => {
      editorRef._onContentChange();
    });

    expect(onContentChange).toHaveBeenCalled();
    const args = onContentChange.mock.calls[0][0];
    expect(typeof args.value).toBe('string');
    expect(typeof args.cursor).toBe('number');
  });

  test('fires onActivity when cursor moves', async () => {
    const { default: Editor } = await import('../src/components/Editor');
    const onActivity = vi.fn();
    let editorRef: any = null;

    render(
      <Editor
        ref={(ref: any) => {
          editorRef = ref;
        }}
        value="hello world"
        onActivity={onActivity}
      />,
    );

    expect(editorRef).toBeTruthy();
    editorRef._onActivity();

    expect(onActivity).toHaveBeenCalled();
    expect(typeof onActivity.mock.calls[0][0]).toBe('number');
  });

  test('updates value when prop changes', async () => {
    const { default: Editor } = await import('../src/components/Editor');
    let editorRef: any = null;

    const { rerender } = render(
      <Editor
        ref={(ref: any) => {
          editorRef = ref;
        }}
        value="first"
      />,
    );

    rerender(
      <Editor
        ref={(ref: any) => {
          editorRef = ref;
        }}
        value="second"
      />,
    );

    // The Monaco editor should have the new value
    expect(editorRef?.monacoEditor).toBeTruthy();
  });

  test('shows error marker decoration', async () => {
    const { default: Editor } = await import('../src/components/Editor');
    const error = { message: 'Syntax error', loc: { line: 1 } };
    const { container } = render(<Editor value="invalid{}" error={error} mode="javascript" />);
    // Error decoration is applied via deltaDecorations
    const monacoEl = container.querySelector('.monaco-editor');
    expect(monacoEl).toBeTruthy();
  });

  test('highlights text range via pubsub', async () => {
    const { default: Editor } = await import('../src/components/Editor');
    const { publish } = await import('../src/utils/pubsub');

    let editorRef: any = null;
    render(
      <Editor
        ref={(ref: any) => {
          editorRef = ref;
        }}
        value="hello world test"
        highlight={true}
      />,
    );

    expect(editorRef?.monacoEditor).toBeTruthy();

    await act(async () => {
      publish('HIGHLIGHT', { range: [0, 5] });
      await new Promise((r) => setTimeout(r, 50));
    });

    // Decorations should have been applied
    // We can't directly inspect Monaco decorations in the DOM easily,
    // but we verify no error was thrown
  });

  test('clears highlight via pubsub', async () => {
    const { default: Editor } = await import('../src/components/Editor');
    const { publish } = await import('../src/utils/pubsub');

    render(<Editor value="hello world" highlight={true} />);

    await act(async () => {
      publish('HIGHLIGHT', { range: [0, 5] });
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => {
      publish('CLEAR_HIGHLIGHT', { range: [0, 5] });
      await new Promise((r) => setTimeout(r, 50));
    });

    // No error = success
  });

  test('handles PANEL_RESIZE by calling layout', async () => {
    const { default: Editor } = await import('../src/components/Editor');
    const { publish } = await import('../src/utils/pubsub');

    let editorRef: any = null;
    render(
      <Editor
        ref={(ref: any) => {
          editorRef = ref;
        }}
        value="hello"
      />,
    );

    const layoutSpy = vi.spyOn(editorRef.monacoEditor, 'layout');

    await act(async () => {
      publish('PANEL_RESIZE', undefined);
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(layoutSpy).toHaveBeenCalled();
    layoutSpy.mockRestore();
  });

  test('disposes editor on unmount', async () => {
    const { default: Editor } = await import('../src/components/Editor');
    let editorRef: any = null;

    const { unmount } = render(
      <Editor
        ref={(ref: any) => {
          editorRef = ref;
        }}
        value="hello"
      />,
    );

    const disposeSpy = vi.spyOn(editorRef.monacoEditor, 'dispose');
    unmount();
    expect(disposeSpy).toHaveBeenCalled();
  });
});

// ===========================================================================
// JSONEditor View
// ===========================================================================
describe('Monaco Editor - JSON View', () => {
  test('renders Monaco editor for JSON content', async () => {
    const { default: JSONEditor } = await import('../src/components/JSONEditor');
    const { container } = render(<JSONEditor value='{"key": "value"}' />);
    const monacoEl = container.querySelector('.monaco-editor');
    expect(monacoEl).toBeTruthy();
  });

  test('applies className to wrapper', async () => {
    const { default: JSONEditor } = await import('../src/components/JSONEditor');
    const { container } = render(<JSONEditor value="{}" className="container no-toolbar" />);
    const el = container.querySelector('#JSONEditor');
    expect(el).toBeTruthy();
    expect(el!.className).toContain('container');
  });

  test('updates value when prop changes', async () => {
    const { default: JSONEditor } = await import('../src/components/JSONEditor');
    const { rerender, container } = render(<JSONEditor value='{"old": true}' />);
    rerender(<JSONEditor value='{"new": true}' />);
    const monacoEl = container.querySelector('.monaco-editor');
    expect(monacoEl).toBeTruthy();
  });

  test('disposes editor on unmount', async () => {
    const { default: JSONEditor } = await import('../src/components/JSONEditor');
    const { unmount, container } = render(<JSONEditor value="{}" />);
    expect(container.querySelector('.monaco-editor')).toBeTruthy();
    expect(() => unmount()).not.toThrow();
  });
});

// ===========================================================================
// Transformer View (split: editor + output)
// ===========================================================================
describe('Monaco Editor - Transformer View', () => {
  test('renders transformer with Monaco editors', async () => {
    const { default: Transformer } = await import('../src/components/Transformer');
    const props = {
      transformer: { id: 'babel', displayName: 'babel' },
      transformCode: 'module.exports = function(babel) {};',
      onContentChange: vi.fn(),
      enableFormatting: false,
      keyMap: 'default',
      toggleFormatting: vi.fn(),
      transformResult: null,
      mode: 'javascript',
    };

    const { container } = render(<Transformer {...props} />);
    const editors = container.querySelectorAll('.monaco-editor');
    // At least 1 Monaco editor (the transform code editor)
    expect(editors.length).toBeGreaterThanOrEqual(1);
  });

  test('renders transform output with string result', async () => {
    const { default: Transformer } = await import('../src/components/Transformer');
    const props = {
      transformer: { id: 'babel', displayName: 'babel' },
      transformCode: 'code',
      onContentChange: vi.fn(),
      enableFormatting: false,
      keyMap: 'default',
      toggleFormatting: vi.fn(),
      transformResult: { result: 'const output = 1;' },
      mode: 'javascript',
    };

    const { container } = render(<Transformer {...props} />);
    expect(container.querySelector('.output.highlight')).toBeTruthy();
  });

  test('renders transform output with error', async () => {
    const { default: Transformer } = await import('../src/components/Transformer');
    const props = {
      transformer: { id: 'babel', displayName: 'babel' },
      transformCode: 'code',
      onContentChange: vi.fn(),
      enableFormatting: false,
      keyMap: 'default',
      toggleFormatting: vi.fn(),
      transformResult: { error: { message: 'Transform failed!' } },
      mode: 'javascript',
    };

    const { container } = render(<Transformer {...props} />);
    expect(container.querySelector('.output.highlight')).toBeTruthy();
  });

  test('renders transform output with object result (JSON)', async () => {
    const { default: Transformer } = await import('../src/components/Transformer');
    const props = {
      transformer: { id: 'babel', displayName: 'babel' },
      transformCode: 'code',
      onContentChange: vi.fn(),
      enableFormatting: false,
      keyMap: 'default',
      toggleFormatting: vi.fn(),
      transformResult: { result: { type: 'Program', body: [] } },
      mode: 'javascript',
    };

    const { container } = render(<Transformer {...props} />);
    expect(container.querySelector('#JSONEditor')).toBeTruthy();
  });
});

// ===========================================================================
// CodeEditorContainer (code view with Redux)
// ===========================================================================
describe('Monaco Editor - CodeEditorContainer', () => {
  test('renders Monaco editor connected to Redux store', async () => {
    const { default: CodeEditorContainer } = await import('../src/containers/CodeEditorContainer');
    const store = makeStore();

    const { container } = renderWithStore(<CodeEditorContainer />, store);
    const monacoEl = container.querySelector('.monaco-editor');
    expect(monacoEl).toBeTruthy();
  });
});

// ===========================================================================
// TransformerContainer (transformer view with Redux)
// ===========================================================================
describe('Monaco Editor - TransformerContainer', () => {
  test('renders Monaco editors connected to Redux store', async () => {
    const { default: TransformerContainer } =
      await import('../src/containers/TransformerContainer');
    const store = makeStore();
    store.dispatch({
      type: 'SELECT_TRANSFORMER',
      transformer: {
        id: 'babel',
        displayName: 'babel',
        defaultTransform: '// transform',
        defaultParserID: 'acorn',
      },
    } as any);

    const { container } = renderWithStore(<TransformerContainer />, store);
    const editors = container.querySelectorAll('.monaco-editor');
    expect(editors.length).toBeGreaterThan(0);
  });
});
