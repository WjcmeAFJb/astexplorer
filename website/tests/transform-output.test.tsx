/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

// We capture the posFromIndex prop passed to Editor so we can call positionFromIndex directly.
let capturedEditorProps: Record<string, unknown> = {};

const { mockCmInstance, mockCodeMirror } = vi.hoisted(() => {
  const _mockCmInstance = {
    getValue: vi.fn(() => ''),
    setValue: vi.fn(),
    setOption: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getDoc: vi.fn(() => ({
      getValue: vi.fn(() => ''),
      getCursor: vi.fn(() => ({ line: 0, ch: 0 })),
      indexFromPos: vi.fn(() => 0),
      posFromIndex: vi.fn((i: number) => ({ line: 0, ch: i })),
    })),
    getCursor: vi.fn(() => ({ line: 0, ch: 0 })),
    addLineClass: vi.fn(),
    removeLineClass: vi.fn(),
    markText: vi.fn(() => ({ clear: vi.fn() })),
    refresh: vi.fn(),
    getScrollInfo: vi.fn(() => ({ left: 0, top: 0 })),
    scrollTo: vi.fn(),
  };
  const _mockCodeMirror = vi.fn((container: HTMLElement) => {
    const el = document.createElement('div');
    el.className = 'CodeMirror';
    container.appendChild(el);
    return _mockCmInstance;
  });
  return { mockCmInstance: _mockCmInstance, mockCodeMirror: _mockCodeMirror };
});

vi.mock('codemirror', () => ({
  default: mockCodeMirror,
}));

vi.mock('codemirror/keymap/vim', () => ({}));
vi.mock('codemirror/keymap/emacs', () => ({}));
vi.mock('codemirror/keymap/sublime', () => ({}));
vi.mock('codemirror/mode/javascript/javascript', () => ({}));
vi.mock('codemirror/addon/fold/foldgutter', () => ({}));
vi.mock('codemirror/addon/fold/foldcode', () => ({}));
vi.mock('codemirror/addon/fold/brace-fold', () => ({}));

vi.mock('../src/codemirrorModes', () => ({
  ensureCMMode: vi.fn(() => Promise.resolve()),
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
    // map is undefined, so positionFromIndex returns undefined
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
    // index=0 returns early, so generatedPositionFor is NOT called
    expect(mockMap.generatedPositionFor).not.toHaveBeenCalled();
  });

  test('maps non-zero index through source map', () => {
    // Source content: "hello\nworld" (index 7 = 'o' in 'world', line 2 col 1)
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
    // generatedPositionFor returns {line:3, column:5} => {line: 2, ch: 5}
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
    // Source: "abcdef" (no newlines)
    // index 3 => lastIndexOf('\n', 2) = -1, column = 3 - (-1) - 1 = 3, line = 1
    // lineStart <= 0, so no while loop, and lineStart is -1 (not 0) so no extra line++
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
    // Source: "aaa\nbbb\nccc" => index 9 = 'c' on line 3
    // lastIndexOf('\n', 8) = 7, column = 9 - 7 - 1 = 1, line = 1
    // while: lastIndexOf('\n', 6) = 3, line=2
    // while: lastIndexOf('\n', 2) = -1 (<=0, exit), line stays 2
    // lineStart is -1 (not 0), so no extra line++
    // Actually let's recount: line starts at 1. lastIndexOf('\n', 8)=7.
    // while(7>0): lastIndexOf('\n',6)=3, line=2. while(3>0): lastIndexOf('\n',2)=-1, line=3. -1<=0 exit.
    // lineStart=-1 !== 0, so no extra line++. Final line=3
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
    // Source: "\nabc" => index 2 = 'b'
    // lastIndexOf('\n', 1) = 0, column = 2 - 0 - 1 = 1, line = 1
    // while(0 > 0) => false, skip
    // lineStart === 0 => line++, line = 2
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
