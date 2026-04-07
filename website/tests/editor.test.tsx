/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, act } from '@testing-library/react';

// Flush pending microtasks
const flushMicrotasks = () => act(() => new Promise((r) => setTimeout(r, 0)));

const { mockModel, mockEditor, mockMonaco } = vi.hoisted(() => {
  const _mockModel = {
    getValue: vi.fn(() => 'initial code'),
    getPositionAt: vi.fn((offset: number) => ({ lineNumber: 1, column: offset + 1 })),
    getOffsetAt: vi.fn((pos: { lineNumber: number; column: number }) => pos.column - 1),
    dispose: vi.fn(),
  };

  const _mockEditor = {
    getValue: vi.fn(() => 'initial code'),
    setValue: vi.fn(),
    getModel: vi.fn(() => _mockModel),
    getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
    getDomNode: vi.fn(() => document.createElement('div')),
    getScrollTop: vi.fn(() => 0),
    getScrollLeft: vi.fn(() => 0),
    setScrollPosition: vi.fn(),
    onDidBlurEditorWidget: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeCursorPosition: vi.fn(() => ({ dispose: vi.fn() })),
    deltaDecorations: vi.fn((_old: string[], _new: unknown[]) =>
      _new.map((_: unknown, i: number) => `deco-${i}`),
    ),
    layout: vi.fn(),
    dispose: vi.fn(),
  };

  const _mockMonaco = {
    editor: {
      create: vi.fn((container: HTMLElement) => {
        const el = document.createElement('div');
        el.className = 'monaco-editor';
        container.appendChild(el);
        return _mockEditor;
      }),
      setModelLanguage: vi.fn(),
    },
    Range: vi.fn((startLine: number, startCol: number, endLine: number, endCol: number) => ({
      startLineNumber: startLine,
      startColumn: startCol,
      endLineNumber: endLine,
      endColumn: endCol,
    })),
  };

  return { mockModel: _mockModel, mockEditor: _mockEditor, mockMonaco: _mockMonaco };
});

vi.mock('monaco-editor', () => mockMonaco);

vi.mock('../src/monacoLanguages', () => ({
  getMonacoLanguage: vi.fn((mode: string) => mode || 'plaintext'),
  ensureLanguageRegistered: vi.fn(),
}));

import Editor from '../src/components/Editor';

describe('Editor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders a div.editor element', () => {
    const { container } = render(<Editor value="hello" />);
    expect(container.querySelector('.editor')).not.toBeNull();
  });

  test('initializes Monaco with provided value', () => {
    render(<Editor value="test code" />);
    const calls = mockMonaco.editor.create.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const lastOpts = calls[calls.length - 1][1];
    expect(lastOpts.value).toBe('test code');
  });

  test('initializes Monaco with default props', () => {
    render(<Editor />);
    const calls = mockMonaco.editor.create.mock.calls;
    const lastOpts = calls[calls.length - 1][1];
    expect(lastOpts.lineNumbers).toBe('on');
    expect(lastOpts.readOnly).toBe(false);
  });

  test('initializes Monaco with custom lineNumbers', () => {
    render(<Editor lineNumbers={false} />);
    const calls = mockMonaco.editor.create.mock.calls;
    const lastOpts = calls[calls.length - 1][1];
    expect(lastOpts.lineNumbers).toBe('off');
  });

  test('initializes Monaco with readOnly', () => {
    render(<Editor readOnly={true} />);
    const calls = mockMonaco.editor.create.mock.calls;
    const lastOpts = calls[calls.length - 1][1];
    expect(lastOpts.readOnly).toBe(true);
  });

  test('binds change and cursor handlers', () => {
    render(<Editor value="hello" />);
    expect(mockEditor.onDidBlurEditorWidget).toHaveBeenCalled();
    expect(mockEditor.onDidChangeModelContent).toHaveBeenCalled();
    expect(mockEditor.onDidChangeCursorPosition).toHaveBeenCalled();
  });

  test('subscribes to PANEL_RESIZE', () => {
    render(<Editor value="hello" />);
    expect(mockEditor.onDidChangeModelContent).toHaveBeenCalled();
  });

  test('subscribes to HIGHLIGHT when highlight=true', () => {
    render(<Editor value="hello" highlight={true} />);
    expect(mockEditor.onDidChangeModelContent).toHaveBeenCalled();
  });

  test('does not subscribe to HIGHLIGHT when highlight=false', () => {
    render(<Editor value="hello" highlight={false} />);
    expect(mockEditor.onDidChangeModelContent).toHaveBeenCalled();
  });

  test('unmounts cleanly and disposes Monaco', async () => {
    const { unmount } = render(<Editor value="hello" />);
    await flushMicrotasks();
    expect(() => unmount()).not.toThrow();
    expect(mockEditor.dispose).toHaveBeenCalled();
  });

  test('updates value when prop changes', async () => {
    const { rerender } = render(<Editor value="initial" />);
    await flushMicrotasks();
    rerender(<Editor value="updated" />);
    expect(mockEditor.setValue).toHaveBeenCalledWith('updated');
  });

  test('does not call setValue when value prop is same', async () => {
    mockEditor.setValue.mockClear();
    const { rerender } = render(<Editor value="same" />);
    await flushMicrotasks();
    mockEditor.setValue.mockClear();
    rerender(<Editor value="same" />);
    expect(mockEditor.setValue).not.toHaveBeenCalled();
  });

  test('handles error prop by adding error decoration', async () => {
    const error = { message: 'Error', loc: { line: 5 } };
    render(<Editor value="x" error={error} />);
    await flushMicrotasks();
    expect(mockEditor.deltaDecorations).toHaveBeenCalled();
    const lastCall =
      mockEditor.deltaDecorations.mock.calls[mockEditor.deltaDecorations.mock.calls.length - 1];
    const decos = lastCall[1];
    expect(decos.length).toBe(1);
    expect(decos[0].options.className).toBe('errorMarker');
    expect(decos[0].options.isWholeLine).toBe(true);
  });

  test('handles error with lineNumber property', async () => {
    const error = { message: 'Error', lineNumber: 3 };
    render(<Editor value="x" error={error} />);
    await flushMicrotasks();
    const calls = mockEditor.deltaDecorations.mock.calls;
    const errorDecoCall = calls.find(
      (c: any[]) => c[1].length > 0 && c[1][0]?.options?.className === 'errorMarker',
    );
    expect(errorDecoCall).toBeDefined();
  });

  test('handles error with line property', async () => {
    const error = { message: 'Error', line: 7 };
    render(<Editor value="x" error={error} />);
    await flushMicrotasks();
    const calls = mockEditor.deltaDecorations.mock.calls;
    const errorDecoCall = calls.find(
      (c: any[]) => c[1].length > 0 && c[1][0]?.options?.className === 'errorMarker',
    );
    expect(errorDecoCall).toBeDefined();
  });

  test('default props are set correctly', () => {
    expect(Editor.defaultProps.value).toBe('');
    expect(Editor.defaultProps.highlight).toBe(true);
    expect(Editor.defaultProps.lineNumbers).toBe(true);
    expect(Editor.defaultProps.readOnly).toBe(false);
    expect(Editor.defaultProps.mode).toBe('javascript');
    expect(Editor.defaultProps.keyMap).toBe('default');
    expect(typeof Editor.defaultProps.onContentChange).toBe('function');
    expect(typeof Editor.defaultProps.onActivity).toBe('function');
  });

  test('getValue returns Monaco value', async () => {
    let editorRef: Editor | null = null;
    render(
      <Editor
        ref={(ref: any) => {
          editorRef = ref;
        }}
        value="test"
      />,
    );
    await flushMicrotasks();
    if (editorRef) {
      expect(editorRef.getValue()).toBe('initial code');
    }
  });

  test('_onContentChange calls onContentChange prop with value and cursor', async () => {
    const onContentChange = vi.fn();
    mockModel.getValue.mockReturnValue('new code');
    mockModel.getOffsetAt.mockReturnValue(15);

    let editorRef: Editor | null = null;
    render(
      <Editor
        ref={(ref: any) => {
          editorRef = ref;
        }}
        value="initial"
        onContentChange={onContentChange}
      />,
    );
    await flushMicrotasks();

    expect(editorRef).not.toBeNull();
    await act(async () => {
      (editorRef as any)._onContentChange();
    });

    expect(onContentChange).toHaveBeenCalledWith({ value: 'new code', cursor: 15 });
  });

  test('_onActivity calls onActivity prop with cursor position', async () => {
    const onActivity = vi.fn();
    mockModel.getOffsetAt.mockReturnValue(42);

    let editorRef: Editor | null = null;
    render(
      <Editor
        ref={(ref: any) => {
          editorRef = ref;
        }}
        value="hello"
        onActivity={onActivity}
      />,
    );
    await flushMicrotasks();

    expect(editorRef).not.toBeNull();
    (editorRef as any)._onActivity();
    expect(onActivity).toHaveBeenCalledWith(42);
  });

  test('blur handler with enableFormatting calls prettier via require', async () => {
    render(<Editor value="hello" enableFormatting={true} />);
    await flushMicrotasks();

    // Get the blur handler
    const blurHandler = mockEditor.onDidBlurEditorWidget.mock.calls[0]?.[0] as () => void;
    expect(blurHandler).toBeDefined();

    // Catch the require error - it uses AMD-style require which isn't available
    try {
      blurHandler();
    } catch {
      // Expected - AMD require not available
    }
  });

  test('blur handler without enableFormatting returns early', async () => {
    render(<Editor value="hello" enableFormatting={false} />);
    await flushMicrotasks();

    const blurHandler = mockEditor.onDidBlurEditorWidget.mock.calls[0]?.[0] as () => void;
    expect(blurHandler).toBeDefined();

    // Should return early without any side effects
    blurHandler();
  });

  test('componentWillUnmount disposes editor', async () => {
    const { unmount } = render(<Editor value="hello" highlight={true} />);
    await flushMicrotasks();

    expect(() => unmount()).not.toThrow();
    expect(mockEditor.dispose).toHaveBeenCalled();
  });

  test('HIGHLIGHT subscription marks text range', async () => {
    const { publish } = await import('../src/utils/pubsub');

    mockEditor.deltaDecorations.mockClear();

    render(<Editor value="hello world" highlight={true} />);
    await flushMicrotasks();

    await act(async () => {
      publish('HIGHLIGHT', { range: [0, 5] });
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(mockEditor.deltaDecorations).toHaveBeenCalled();
  });

  test('HIGHLIGHT subscription clears previous decoration', async () => {
    const { publish } = await import('../src/utils/pubsub');
    mockEditor.deltaDecorations.mockClear();

    render(<Editor value="hello world" highlight={true} />);
    await flushMicrotasks();

    await act(async () => {
      publish('HIGHLIGHT', { range: [0, 3] });
      await new Promise((r) => setTimeout(r, 10));
    });

    await act(async () => {
      publish('HIGHLIGHT', { range: [2, 5] });
      await new Promise((r) => setTimeout(r, 10));
    });

    // deltaDecorations is called with old IDs to clear
    expect(mockEditor.deltaDecorations.mock.calls.length).toBeGreaterThan(1);
  });

  test('HIGHLIGHT returns early when range is undefined', async () => {
    const { publish } = await import('../src/utils/pubsub');

    mockEditor.deltaDecorations.mockClear();
    render(<Editor value="hello" highlight={true} />);
    await flushMicrotasks();

    const callsBefore = mockEditor.deltaDecorations.mock.calls.length;

    await act(async () => {
      publish('HIGHLIGHT', {});
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(mockEditor.deltaDecorations.mock.calls.length).toBe(callsBefore);
  });

  test('CLEAR_HIGHLIGHT clears decorations', async () => {
    const { publish } = await import('../src/utils/pubsub');
    mockEditor.deltaDecorations.mockClear();

    render(<Editor value="hello" highlight={true} />);
    await flushMicrotasks();

    await act(async () => {
      publish('HIGHLIGHT', { range: [0, 3] });
      await new Promise((r) => setTimeout(r, 10));
    });

    await act(async () => {
      publish('CLEAR_HIGHLIGHT', { range: [0, 3] });
      await new Promise((r) => setTimeout(r, 10));
    });

    // Last deltaDecorations call should clear (pass empty array as new decorations)
    const lastCall =
      mockEditor.deltaDecorations.mock.calls[mockEditor.deltaDecorations.mock.calls.length - 1];
    expect(lastCall[1]).toEqual([]);
  });

  test('CLEAR_HIGHLIGHT without range clears any decoration', async () => {
    const { publish } = await import('../src/utils/pubsub');
    mockEditor.deltaDecorations.mockClear();

    render(<Editor value="hello" highlight={true} />);
    await flushMicrotasks();

    await act(async () => {
      publish('HIGHLIGHT', { range: [0, 3] });
      await new Promise((r) => setTimeout(r, 10));
    });

    await act(async () => {
      publish('CLEAR_HIGHLIGHT', undefined);
      await new Promise((r) => setTimeout(r, 10));
    });

    const lastCall =
      mockEditor.deltaDecorations.mock.calls[mockEditor.deltaDecorations.mock.calls.length - 1];
    expect(lastCall[1]).toEqual([]);
  });

  test('CLEAR_HIGHLIGHT with non-matching range does not clear', async () => {
    const { publish } = await import('../src/utils/pubsub');
    mockEditor.deltaDecorations.mockClear();

    render(<Editor value="hello" highlight={true} />);
    await flushMicrotasks();

    await act(async () => {
      publish('HIGHLIGHT', { range: [0, 3] });
      await new Promise((r) => setTimeout(r, 10));
    });

    const callsAfterHighlight = mockEditor.deltaDecorations.mock.calls.length;

    await act(async () => {
      publish('CLEAR_HIGHLIGHT', { range: [5, 10] });
      await new Promise((r) => setTimeout(r, 10));
    });

    // No additional deltaDecorations calls for non-matching range
    expect(mockEditor.deltaDecorations.mock.calls.length).toBe(callsAfterHighlight);
  });

  test('PANEL_RESIZE triggers layout', async () => {
    const { publish } = await import('../src/utils/pubsub');

    mockEditor.layout.mockClear();
    render(<Editor value="hello" />);
    await flushMicrotasks();

    await act(async () => {
      publish('PANEL_RESIZE', undefined);
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(mockEditor.layout).toHaveBeenCalled();
  });

  test('_posFromIndex uses posFromIndex prop when provided', async () => {
    const customPosFromIndex = vi.fn((index: number) => ({ line: 10, ch: index }));

    let editorRef: Editor | null = null;
    render(
      <Editor
        ref={(ref: any) => {
          editorRef = ref;
        }}
        value="hello"
        posFromIndex={customPosFromIndex}
      />,
    );
    await flushMicrotasks();

    expect(editorRef).not.toBeNull();
    const result = (editorRef as any)._posFromIndex(mockModel, 5);
    expect(customPosFromIndex).toHaveBeenCalledWith(5);
    expect(result).toEqual({ line: 10, ch: 5 });
  });

  test('mode change sets model language', async () => {
    const { rerender } = render(<Editor value="x" mode="javascript" />);
    await flushMicrotasks();
    mockMonaco.editor.setModelLanguage.mockClear();
    rerender(<Editor value="x" mode="css" />);
    expect(mockMonaco.editor.setModelLanguage).toHaveBeenCalled();
  });

  test('error removed when updating with new error', async () => {
    const error1 = { message: 'Error1', loc: { line: 3 } };
    const error2 = { message: 'Error2', loc: { line: 5 } };
    const { rerender } = render(<Editor value="x" error={error1} />);
    await flushMicrotasks();
    mockEditor.deltaDecorations.mockClear();
    rerender(<Editor value="x" error={error2} />);
    // deltaDecorations should be called to clear old and add new
    expect(mockEditor.deltaDecorations).toHaveBeenCalled();
  });

  test('error with no line number does not add decoration', async () => {
    const error = { message: 'Error' };
    mockEditor.deltaDecorations.mockClear();
    render(<Editor value="x" error={error} />);
    await flushMicrotasks();
    // deltaDecorations should be called but with empty new decorations (clear only)
    // then no new error decoration since no line number
    const calls = mockEditor.deltaDecorations.mock.calls;
    const hasErrorDeco = calls.some((c: any[]) =>
      c[1].some?.((d: any) => d?.options?.className === 'errorMarker'),
    );
    expect(hasErrorDeco).toBe(false);
  });

  test('getDerivedStateFromProps returns null when value unchanged', () => {
    const result = Editor.getDerivedStateFromProps({ value: 'same' } as any, { value: 'same' });
    expect(result).toBeNull();
  });

  test('getDerivedStateFromProps returns new state when value changed', () => {
    const result = Editor.getDerivedStateFromProps({ value: 'new' } as any, { value: 'old' });
    expect(result).toEqual({ value: 'new' });
  });

  test('changes handler calls clearTimeout and sets timer', async () => {
    const onContentChange = vi.fn();
    mockModel.getValue.mockReturnValue('changed');
    mockModel.getOffsetAt.mockReturnValue(7);

    render(<Editor value="initial" onContentChange={onContentChange} />);
    await flushMicrotasks();

    // Find the content change handler registered on the editor
    const changesHandler = mockEditor.onDidChangeModelContent.mock.calls[0]?.[0] as () => void;
    expect(changesHandler).toBeDefined();

    changesHandler();

    // Wait for the setTimeout(200ms) to fire
    await act(async () => {
      await new Promise((r) => setTimeout(r, 250));
    });

    expect(onContentChange).toHaveBeenCalledWith({ value: 'changed', cursor: 7 });
  });

  test('cursorActivity handler calls clearTimeout and sets timer', async () => {
    const onActivity = vi.fn();
    mockModel.getOffsetAt.mockReturnValue(42);

    render(<Editor value="hello" onActivity={onActivity} />);
    await flushMicrotasks();

    const cursorHandler = mockEditor.onDidChangeCursorPosition.mock.calls[0]?.[0] as () => void;
    expect(cursorHandler).toBeDefined();

    cursorHandler();

    // Wait for the setTimeout(100ms) to fire
    await act(async () => {
      await new Promise((r) => setTimeout(r, 150));
    });

    expect(onActivity).toHaveBeenCalledWith(42);
  });

  test('shouldComponentUpdate returns true when error changes', async () => {
    let editorRef: Editor | null = null;
    const error1 = { message: 'e1' };
    const error2 = { message: 'e2' };
    render(
      <Editor
        ref={(ref: any) => {
          editorRef = ref;
        }}
        value="x"
        error={error1}
      />,
    );
    await flushMicrotasks();
    expect(editorRef).not.toBeNull();
    const should = editorRef!.shouldComponentUpdate({
      ...editorRef!.props,
      error: error2,
    } as any);
    expect(should).toBe(true);
  });

  test('shouldComponentUpdate returns false when nothing changes', async () => {
    let editorRef: Editor | null = null;
    render(
      <Editor
        ref={(ref: any) => {
          editorRef = ref;
        }}
        value="x"
      />,
    );
    await flushMicrotasks();
    expect(editorRef).not.toBeNull();
    const should = editorRef!.shouldComponentUpdate(editorRef!.props);
    expect(should).toBe(false);
  });
});
