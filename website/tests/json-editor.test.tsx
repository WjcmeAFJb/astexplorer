/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

const { mockDoc, mockCmInstance, mockCodeMirror } = vi.hoisted(() => {
  const _mockDoc = {
    getValue: vi.fn(() => '{}'),
    getCursor: vi.fn(() => ({ line: 0, ch: 0 })),
    indexFromPos: vi.fn(() => 0),
  };

  const _mockCmInstance = {
    getValue: vi.fn(() => '{}'),
    setValue: vi.fn(),
    setOption: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getDoc: vi.fn(() => _mockDoc),
    refresh: vi.fn(),
    getScrollInfo: vi.fn(() => ({ left: 0, top: 0 })),
    scrollTo: vi.fn(),
  };

  // The real CodeMirror appends a child element to the container.
  // We need to do the same so componentWillUnmount's removeChild works.
  const _mockCodeMirror = vi.fn((container: HTMLElement) => {
    const el = document.createElement('div');
    el.className = 'CodeMirror';
    container.appendChild(el);
    return _mockCmInstance;
  });

  return { mockDoc: _mockDoc, mockCmInstance: _mockCmInstance, mockCodeMirror: _mockCodeMirror };
});

vi.mock('codemirror', () => ({
  default: mockCodeMirror,
}));

vi.mock('codemirror/mode/javascript/javascript', () => ({}));
vi.mock('codemirror/addon/fold/foldgutter', () => ({}));
vi.mock('codemirror/addon/fold/foldcode', () => ({}));
vi.mock('codemirror/addon/fold/brace-fold', () => ({}));

import JSONEditor from '../src/components/JSONEditor';

describe('JSONEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders a div#JSONEditor element', () => {
    const { container } = render(<JSONEditor value='{"key": "value"}' />);
    expect(container.querySelector('#JSONEditor')).not.toBeNull();
  });

  test('initializes CodeMirror with JSON mode', () => {
    render(<JSONEditor value='{}' />);
    const calls = mockCodeMirror.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const lastOpts = calls[calls.length - 1][1];
    expect(lastOpts.mode).toEqual({ name: 'javascript', json: true });
  });

  test('initializes CodeMirror as readOnly', () => {
    render(<JSONEditor value='{}' />);
    const calls = mockCodeMirror.mock.calls;
    const lastOpts = calls[calls.length - 1][1];
    expect(lastOpts.readOnly).toBe(true);
  });

  test('initializes CodeMirror with lineNumbers', () => {
    render(<JSONEditor value='{}' />);
    const calls = mockCodeMirror.mock.calls;
    const lastOpts = calls[calls.length - 1][1];
    expect(lastOpts.lineNumbers).toBe(true);
  });

  test('initializes CodeMirror with foldGutter', () => {
    render(<JSONEditor value='{}' />);
    const calls = mockCodeMirror.mock.calls;
    const lastOpts = calls[calls.length - 1][1];
    expect(lastOpts.foldGutter).toBe(true);
  });

  test('initializes CodeMirror with correct gutters', () => {
    render(<JSONEditor value='{}' />);
    const calls = mockCodeMirror.mock.calls;
    const lastOpts = calls[calls.length - 1][1];
    expect(lastOpts.gutters).toEqual(['CodeMirror-linenumbers', 'CodeMirror-foldgutter']);
  });

  test('applies className prop to wrapper', () => {
    const { container } = render(
      <JSONEditor value='{}' className="container no-toolbar" />,
    );
    const el = container.querySelector('#JSONEditor')!;
    expect(el.className).toContain('container');
    expect(el.className).toContain('no-toolbar');
  });

  test('updates value when prop changes', () => {
    mockCmInstance.getValue.mockReturnValue('old value');
    const { rerender } = render(<JSONEditor value='{"old": true}' />);
    mockCmInstance.setValue.mockClear();
    rerender(<JSONEditor value='{"new": true}' />);
    expect(mockCmInstance.setValue).toHaveBeenCalledWith('{"new": true}');
  });

  test('does not update value when prop is same', () => {
    const { rerender } = render(<JSONEditor value='{"same": true}' />);
    mockCmInstance.setValue.mockClear();
    rerender(<JSONEditor value='{"same": true}' />);
    expect(mockCmInstance.setValue).not.toHaveBeenCalled();
  });

  test('does not update when CodeMirror already has same value', () => {
    mockCmInstance.getValue.mockReturnValue('{"new": true}');
    const { rerender } = render(<JSONEditor value='{"old": true}' />);
    mockCmInstance.setValue.mockClear();
    rerender(<JSONEditor value='{"new": true}' />);
    // The component checks both props and CM value
    expect(mockCmInstance.setValue).not.toHaveBeenCalled();
  });

  test('restores scroll position after value update', () => {
    mockCmInstance.getValue.mockReturnValue('old');
    mockCmInstance.getScrollInfo.mockReturnValue({ left: 10, top: 20 });
    const { rerender } = render(<JSONEditor value='old' />);
    rerender(<JSONEditor value='new' />);
    expect(mockCmInstance.scrollTo).toHaveBeenCalledWith(10, 20);
  });

  test('unmounts cleanly', () => {
    const { unmount } = render(<JSONEditor value='{}' />);
    expect(() => unmount()).not.toThrow();
  });
});
