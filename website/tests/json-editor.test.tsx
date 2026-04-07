/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

const { mockEditor, mockMonaco } = vi.hoisted(() => {
  const _mockEditor = {
    getValue: vi.fn(() => '{}'),
    setValue: vi.fn(),
    getModel: vi.fn(() => null),
    getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
    getDomNode: vi.fn(() => document.createElement('div')),
    getScrollTop: vi.fn(() => 0),
    getScrollLeft: vi.fn(() => 0),
    setScrollPosition: vi.fn(),
    onDidBlurEditorWidget: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeCursorPosition: vi.fn(() => ({ dispose: vi.fn() })),
    deltaDecorations: vi.fn(() => []),
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
    Range: vi.fn(),
  };

  return { mockEditor: _mockEditor, mockMonaco: _mockMonaco };
});

vi.mock('monaco-editor', () => mockMonaco);

import JSONEditor from '../src/components/JSONEditor';

describe('JSONEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders a div#JSONEditor element', () => {
    const { container } = render(<JSONEditor value='{"key": "value"}' />);
    expect(container.querySelector('#JSONEditor')).not.toBeNull();
  });

  test('initializes Monaco with JSON language', () => {
    render(<JSONEditor value="{}" />);
    const calls = mockMonaco.editor.create.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const lastOpts = calls[calls.length - 1][1];
    expect(lastOpts.language).toBe('json');
  });

  test('initializes Monaco as readOnly', () => {
    render(<JSONEditor value="{}" />);
    const calls = mockMonaco.editor.create.mock.calls;
    const lastOpts = calls[calls.length - 1][1];
    expect(lastOpts.readOnly).toBe(true);
  });

  test('initializes Monaco with lineNumbers', () => {
    render(<JSONEditor value="{}" />);
    const calls = mockMonaco.editor.create.mock.calls;
    const lastOpts = calls[calls.length - 1][1];
    expect(lastOpts.lineNumbers).toBe('on');
  });

  test('initializes Monaco with folding', () => {
    render(<JSONEditor value="{}" />);
    const calls = mockMonaco.editor.create.mock.calls;
    const lastOpts = calls[calls.length - 1][1];
    expect(lastOpts.folding).toBe(true);
  });

  test('applies className prop to wrapper', () => {
    const { container } = render(<JSONEditor value="{}" className="container no-toolbar" />);
    const el = container.querySelector('#JSONEditor')!;
    expect(el.className).toContain('container');
    expect(el.className).toContain('no-toolbar');
  });

  test('updates value when prop changes', () => {
    mockEditor.getValue.mockReturnValue('old value');
    const { rerender } = render(<JSONEditor value='{"old": true}' />);
    mockEditor.setValue.mockClear();
    rerender(<JSONEditor value='{"new": true}' />);
    expect(mockEditor.setValue).toHaveBeenCalledWith('{"new": true}');
  });

  test('does not update value when prop is same', () => {
    const { rerender } = render(<JSONEditor value='{"same": true}' />);
    mockEditor.setValue.mockClear();
    rerender(<JSONEditor value='{"same": true}' />);
    expect(mockEditor.setValue).not.toHaveBeenCalled();
  });

  test('does not update when Monaco already has same value', () => {
    mockEditor.getValue.mockReturnValue('{"new": true}');
    const { rerender } = render(<JSONEditor value='{"old": true}' />);
    mockEditor.setValue.mockClear();
    rerender(<JSONEditor value='{"new": true}' />);
    expect(mockEditor.setValue).not.toHaveBeenCalled();
  });

  test('restores scroll position after value update', () => {
    mockEditor.getValue.mockReturnValue('old');
    mockEditor.getScrollTop.mockReturnValue(20);
    mockEditor.getScrollLeft.mockReturnValue(10);
    const { rerender } = render(<JSONEditor value="old" />);
    rerender(<JSONEditor value="new" />);
    expect(mockEditor.setScrollPosition).toHaveBeenCalledWith({ scrollTop: 20, scrollLeft: 10 });
  });

  test('unmounts cleanly', () => {
    const { unmount } = render(<JSONEditor value="{}" />);
    expect(() => unmount()).not.toThrow();
    expect(mockEditor.dispose).toHaveBeenCalled();
  });

  test('PANEL_RESIZE subscription triggers layout', async () => {
    const { publish } = await import('../src/utils/pubsub');
    const { act } = await import('@testing-library/react');

    mockEditor.layout.mockClear();
    render(<JSONEditor value="{}" />);

    await act(async () => {
      publish('PANEL_RESIZE', undefined);
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(mockEditor.layout).toHaveBeenCalled();
  });
});
