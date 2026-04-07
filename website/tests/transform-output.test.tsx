/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

// We capture the posFromIndex prop passed to Editor so we can call positionFromIndex directly.
let capturedEditorProps: Record<string, unknown> = {};

const { mockEditor, mockMonaco } = vi.hoisted(() => {
  const _mockEditor = {
    getValue: vi.fn(() => ''),
    setValue: vi.fn(),
    getModel: vi.fn(() => ({
      getValue: vi.fn(() => ''),
      getPositionAt: vi.fn(() => ({ lineNumber: 1, column: 1 })),
      getOffsetAt: vi.fn(() => 0),
    })),
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

vi.mock('../src/monacoLanguages', () => ({
  getMonacoLanguage: vi.fn((mode: string) => mode || 'plaintext'),
}));

// Mock Editor to capture its props so we can test posFromIndex
vi.mock('../src/components/Editor', () => ({
  default: (props: Record<string, unknown>) => {
    capturedEditorProps = props;
    return React.createElement('div', { className: 'editor' }, String(props.value || ''));
  },
}));

import TransformOutput from '../src/components/TransformOutput';

describe('TransformOutput', () => {
  beforeEach(() => {
    capturedEditorProps = {};
  });

  test('renders with null transformResult (empty placeholder)', () => {
    const { container } = render(<TransformOutput transformResult={null} />);
    expect(container.querySelector('.output.highlight')).not.toBeNull();
  });

  test('renders with undefined transformResult (empty placeholder)', () => {
    const { container } = render(<TransformOutput transformResult={undefined} />);
    expect(container.querySelector('.output.highlight')).not.toBeNull();
  });

  test('renders error message when transformResult has error', () => {
    const result = { error: { message: 'Transform failed!' } };
    render(<TransformOutput transformResult={result} />);
    expect(capturedEditorProps.value).toBe('Transform failed!');
    expect(capturedEditorProps.readOnly).toBe(true);
    expect(capturedEditorProps.highlight).toBe(false);
    expect(capturedEditorProps.lineNumbers).toBe(false);
  });

  test('renders string result via Editor', () => {
    const result = { result: 'const x = 1;' };
    const { container } = render(<TransformOutput transformResult={result} mode="javascript" />);
    expect(container.querySelector('.output.highlight')).not.toBeNull();
    expect(capturedEditorProps.value).toBe('const x = 1;');
    expect(capturedEditorProps.readOnly).toBe(true);
    expect(capturedEditorProps.mode).toBe('javascript');
  });

  test('renders object result via JSONEditor', () => {
    const result = { result: { type: 'Program', body: [] } };
    const { container } = render(<TransformOutput transformResult={result} />);
    expect(container.querySelector('#JSONEditor')).not.toBeNull();
  });

  test('renders empty string result', () => {
    const result = { result: '' };
    const { container } = render(<TransformOutput transformResult={result} />);
    expect(container.querySelector('.output.highlight')).not.toBeNull();
  });
});

// Test positionFromIndex through the posFromIndex callback captured from Editor props
describe('positionFromIndex (via posFromIndex prop)', () => {
  beforeEach(() => {
    capturedEditorProps = {};
  });

  test('returns undefined when map is null/undefined', () => {
    const result = { result: 'code output' };
    render(<TransformOutput transformResult={result} mode="javascript" />);
    const posFromIndex = capturedEditorProps.posFromIndex as (index: number) => unknown;
    expect(posFromIndex).toBeDefined();
    expect(posFromIndex(0)).toBeUndefined();
    expect(posFromIndex(5)).toBeUndefined();
  });

  test('returns {line:0, ch:0} when index is 0', () => {
    const mockMap = {
      sourcesContent: ['hello\nworld'],
      sources: ['source.js'],
      generatedPositionFor: vi.fn(() => ({ line: 1, column: 0 })),
    };
    const result = { result: 'output', map: mockMap };
    render(<TransformOutput transformResult={result} mode="javascript" />);
    const posFromIndex = capturedEditorProps.posFromIndex as (
      index: number,
    ) => { line: number; ch: number } | undefined;
    const pos = posFromIndex(0);
    expect(pos).toEqual({ line: 0, ch: 0 });
    expect(mockMap.generatedPositionFor).not.toHaveBeenCalled();
  });

  test('maps non-zero index through source map', () => {
    const mockMap = {
      sourcesContent: ['hello\nworld'],
      sources: ['source.js'],
      generatedPositionFor: vi.fn(() => ({ line: 3, column: 5 })),
    };
    const result = { result: 'output', map: mockMap };
    render(<TransformOutput transformResult={result} mode="javascript" />);
    const posFromIndex = capturedEditorProps.posFromIndex as (
      index: number,
    ) => { line: number; ch: number } | undefined;
    const pos = posFromIndex(7);
    expect(mockMap.generatedPositionFor).toHaveBeenCalledWith({
      line: 2,
      column: 1,
      source: 'source.js',
    });
    expect(pos).toEqual({ line: 2, ch: 5 });
  });

  test('returns undefined when generatedPositionFor returns null line/column', () => {
    const mockMap = {
      sourcesContent: ['hello\nworld'],
      sources: ['source.js'],
      generatedPositionFor: vi.fn(() => ({ line: null, column: null })),
    };
    const result = { result: 'output', map: mockMap };
    render(<TransformOutput transformResult={result} mode="javascript" />);
    const posFromIndex = capturedEditorProps.posFromIndex as (
      index: number,
    ) => { line: number; ch: number } | undefined;
    const pos = posFromIndex(3);
    expect(pos).toBeUndefined();
  });

  test('handles single-line source (no newlines, lineStart is -1)', () => {
    const mockMap = {
      sourcesContent: ['abcdef'],
      sources: ['s.js'],
      generatedPositionFor: vi.fn(() => ({ line: 1, column: 3 })),
    };
    const result = { result: 'out', map: mockMap };
    render(<TransformOutput transformResult={result} mode="javascript" />);
    const posFromIndex = capturedEditorProps.posFromIndex as (
      index: number,
    ) => { line: number; ch: number } | undefined;
    const pos = posFromIndex(3);
    expect(mockMap.generatedPositionFor).toHaveBeenCalledWith({
      line: 1,
      column: 3,
      source: 's.js',
    });
    expect(pos).toEqual({ line: 0, ch: 3 });
  });

  test('handles multi-line source with index on third line', () => {
    const mockMap = {
      sourcesContent: ['aaa\nbbb\nccc'],
      sources: ['s.js'],
      generatedPositionFor: vi.fn(() => ({ line: 5, column: 2 })),
    };
    const result = { result: 'out', map: mockMap };
    render(<TransformOutput transformResult={result} mode="javascript" />);
    const posFromIndex = capturedEditorProps.posFromIndex as (
      index: number,
    ) => { line: number; ch: number } | undefined;
    const pos = posFromIndex(9);
    expect(mockMap.generatedPositionFor).toHaveBeenCalledWith({
      line: 3,
      column: 1,
      source: 's.js',
    });
    expect(pos).toEqual({ line: 4, ch: 2 });
  });

  test('handles lineStart exactly 0 (source starts with newline)', () => {
    const mockMap = {
      sourcesContent: ['\nabc'],
      sources: ['s.js'],
      generatedPositionFor: vi.fn(() => ({ line: 2, column: 1 })),
    };
    const result = { result: 'out', map: mockMap };
    render(<TransformOutput transformResult={result} mode="javascript" />);
    const posFromIndex = capturedEditorProps.posFromIndex as (
      index: number,
    ) => { line: number; ch: number } | undefined;
    const pos = posFromIndex(2);
    expect(mockMap.generatedPositionFor).toHaveBeenCalledWith({
      line: 2,
      column: 1,
      source: 's.js',
    });
    expect(pos).toEqual({ line: 1, ch: 1 });
  });
});
