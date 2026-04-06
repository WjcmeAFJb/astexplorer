/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';

vi.mock('astexplorer-parsers', () => ({
  categories: [
    {
      id: 'javascript',
      displayName: 'JavaScript',
      mimeTypes: ['text/javascript'],
      parsers: [],
      transformers: [],
    },
    { id: 'css', displayName: 'CSS', mimeTypes: ['text/css'], parsers: [], transformers: [] },
  ],
  getCategoryByID: () => null,
  getParserByID: (id: string) => ({ id, displayName: id }),
  getTransformerByID: () => undefined,
}));

import PasteDropTarget from '../src/components/PasteDropTarget';

describe('PasteDropTarget', () => {
  test('renders children', () => {
    const { getByText } = render(
      <PasteDropTarget onText={() => {}} onError={() => {}}>
        <div>Child content</div>
      </PasteDropTarget>,
    );
    expect(getByText('Child content')).toBeTruthy();
  });

  test('renders without crash when no props', () => {
    const { container } = render(<PasteDropTarget />);
    expect(container.firstElementChild).not.toBeNull();
  });

  test('does not show drop indicator initially', () => {
    const { container } = render(
      <PasteDropTarget onText={() => {}} onError={() => {}}>
        <span>test</span>
      </PasteDropTarget>,
    );
    expect(container.querySelector('.dropIndicator')).toBeNull();
  });

  test('shows drop indicator on dragenter', () => {
    const { container } = render(
      <PasteDropTarget onText={() => {}} onError={() => {}}>
        <span>test</span>
      </PasteDropTarget>,
    );
    const target = container.firstElementChild!;
    fireEvent.dragEnter(target);
    expect(container.querySelector('.dropIndicator')).not.toBeNull();
    expect(container.querySelector('.dropIndicator')!.textContent).toContain('Drop the code');
  });

  test('hides drop indicator on dragleave after timeout', () => {
    vi.useFakeTimers();
    const { container } = render(
      <PasteDropTarget onText={() => {}} onError={() => {}}>
        <span>test</span>
      </PasteDropTarget>,
    );
    const target = container.firstElementChild!;
    fireEvent.dragEnter(target);
    expect(container.querySelector('.dropIndicator')).not.toBeNull();

    fireEvent.dragLeave(target);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(container.querySelector('.dropIndicator')).toBeNull();
    vi.useRealTimers();
  });

  test('dragover sets dropEffect to copy', () => {
    const { container } = render(
      <PasteDropTarget onText={() => {}} onError={() => {}}>
        <span>test</span>
      </PasteDropTarget>,
    );
    const target = container.firstElementChild!;
    const event = new Event('dragover', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', {
      value: { dropEffect: '' },
    });
    target.dispatchEvent(event);
    expect((event as any).dataTransfer.dropEffect).toBe('copy');
  });

  test('passes extra props to wrapper div', () => {
    const { container } = render(
      <PasteDropTarget onText={() => {}} className="custom-class" data-testattr="hello">
        <span>test</span>
      </PasteDropTarget>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('custom-class');
    expect(wrapper.getAttribute('data-testattr')).toBe('hello');
  });

  test('unmounts without error', () => {
    const { unmount } = render(
      <PasteDropTarget onText={() => {}} onError={() => {}}>
        <span>test</span>
      </PasteDropTarget>,
    );
    expect(() => unmount()).not.toThrow();
  });

  test('cleans up listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = render(
      <PasteDropTarget onText={() => {}} onError={() => {}}>
        <span>test</span>
      </PasteDropTarget>,
    );
    unmount();
    // Should have removed the paste listener on document
    expect(removeEventListenerSpy).toHaveBeenCalled();
    removeEventListenerSpy.mockRestore();
  });

  test('drop hides the drop indicator', () => {
    const { container } = render(
      <PasteDropTarget onText={() => {}} onError={() => {}}>
        <span>test</span>
      </PasteDropTarget>,
    );
    const target = container.firstElementChild!;
    fireEvent.dragEnter(target);
    expect(container.querySelector('.dropIndicator')).not.toBeNull();

    // Simulate a drop with a file that has an unrecognized type
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [{ type: 'application/octet-stream', name: 'test.bin' }],
      },
    });
    act(() => {
      target.dispatchEvent(dropEvent);
    });

    expect(container.querySelector('.dropIndicator')).toBeNull();
  });

  test('drop with recognized file type reads file and calls onText', async () => {
    const onText = vi.fn();
    const { container } = render(
      <PasteDropTarget onText={onText} onError={() => {}}>
        <span>test</span>
      </PasteDropTarget>,
    );
    const target = container.firstElementChild!;

    // Create a real File with text/javascript MIME type
    const fileContent = 'var x = 1;';
    const file = new File([fileContent], 'test.js', { type: 'text/javascript' });

    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { files: [file] },
    });

    act(() => {
      target.dispatchEvent(dropEvent);
    });

    // FileReader.readAsText is async; wait for it
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(onText).toHaveBeenCalledWith('drop', expect.anything(), fileContent, 'javascript');
  });

  test('drop with text/plain file that is not valid JSON calls onText with text', async () => {
    const onText = vi.fn();
    const { container } = render(
      <PasteDropTarget onText={onText} onError={() => {}}>
        <span>test</span>
      </PasteDropTarget>,
    );
    const target = container.firstElementChild!;

    const fileContent = 'this is not json';
    const file = new File([fileContent], 'test.txt', { type: 'text/plain' });

    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { files: [file] },
    });

    act(() => {
      target.dispatchEvent(dropEvent);
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Non-JSON text: _jsonToCode resolves with original text (JSON.parse fails)
    expect(onText).toHaveBeenCalled();
  });

  test('drop with css file calls onText with css categoryId', async () => {
    const onText = vi.fn();
    const { container } = render(
      <PasteDropTarget onText={onText} onError={() => {}}>
        <span>test</span>
      </PasteDropTarget>,
    );
    const target = container.firstElementChild!;

    const fileContent = 'body { color: red; }';
    const file = new File([fileContent], 'style.css', { type: 'text/css' });

    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { files: [file] },
    });

    act(() => {
      target.dispatchEvent(dropEvent);
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(onText).toHaveBeenCalledWith('drop', expect.anything(), fileContent, 'css');
  });

  test('drop with no onText returns early', () => {
    const { container } = render(
      <PasteDropTarget>
        <span>test</span>
      </PasteDropTarget>,
    );
    const target = container.firstElementChild!;

    const file = new File(['code'], 'test.js', { type: 'text/javascript' });
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { files: [file] },
    });

    // Should not throw even without onText
    act(() => {
      target.dispatchEvent(dropEvent);
    });
  });

  test('paste with no clipboardData returns early', () => {
    const onText = vi.fn();
    render(
      <PasteDropTarget onText={onText} onError={() => {}}>
        <span>test</span>
      </PasteDropTarget>,
    );

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
    // No clipboardData property at all

    act(() => {
      document.dispatchEvent(pasteEvent);
    });

    expect(onText).not.toHaveBeenCalled();
  });

  test('paste with types having no indexOf returns early', () => {
    const onText = vi.fn();
    render(
      <PasteDropTarget onText={onText} onError={() => {}}>
        <span>test</span>
      </PasteDropTarget>,
    );

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        types: {}, // no indexOf method
        getData: () => 'text',
      },
    });

    act(() => {
      document.dispatchEvent(pasteEvent);
    });

    expect(onText).not.toHaveBeenCalled();
  });

  test('paste where indexOf returns truthy (not text/plain) returns early', () => {
    const onText = vi.fn();
    render(
      <PasteDropTarget onText={onText} onError={() => {}}>
        <span>test</span>
      </PasteDropTarget>,
    );

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        types: { indexOf: () => -1 }, // text/plain not found, indexOf returns -1
        getData: () => 'text',
      },
    });

    act(() => {
      document.dispatchEvent(pasteEvent);
    });

    // !cbdata.types.indexOf is false (indexOf exists), !(-1) > -1 => true > -1 => true
    // so it returns early
    expect(onText).not.toHaveBeenCalled();
  });

  test('paste with text/plain at index 0 returns early due to operator precedence', () => {
    // The condition `!cbdata.types.indexOf('text/plain') > -1` evaluates as
    // `(!0) > -1` => `true > -1` => `1 > -1` => true, so it returns early
    const onText = vi.fn();
    render(
      <PasteDropTarget onText={onText} onError={() => {}}>
        <span>test</span>
      </PasteDropTarget>,
    );

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        types: { indexOf: (t: string) => (t === 'text/plain' ? 0 : -1) },
        getData: () => 'text',
      },
    });

    act(() => {
      document.dispatchEvent(pasteEvent);
    });

    expect(onText).not.toHaveBeenCalled();
  });

  test('_onASTError calls onError and rethrows', () => {
    const onError = vi.fn();
    const ref = React.createRef<PasteDropTarget>();
    render(
      <PasteDropTarget onText={() => {}} onError={onError} ref={ref}>
        <span>test</span>
      </PasteDropTarget>,
    );

    const error = new Error('AST processing failed');
    const mockEvent = new Event('paste');

    expect(() => {
      (ref.current as any)._onASTError('paste', mockEvent, error);
    }).toThrow('AST processing failed');

    expect(onError).toHaveBeenCalledWith(
      'paste',
      mockEvent,
      'Cannot process pasted AST: AST processing failed',
    );
  });

  test('_jsonToCode returns original string when JSON.parse fails', async () => {
    const ref = React.createRef<PasteDropTarget>();
    render(
      <PasteDropTarget onText={() => {}} onError={() => {}} ref={ref}>
        <span>test</span>
      </PasteDropTarget>,
    );

    const result = await (ref.current as any)._jsonToCode('not json');
    expect(result).toBe('not json');
  });

  // Note: _jsonToCode with valid JSON calls importEscodegen() which uses AMD require([...]).
  // This cannot be tested in vitest/Node.js — it requires a browser environment with
  // webpack's AMD require polyfill. Covered by Playwright E2E tests instead.

  // Note: Tests for dropping JSON files (application/json, text/plain with JSON) are omitted.
  // These code paths call _jsonToCode -> importEscodegen() which uses AMD require(['escodegen']).
  // AMD require is not available in vitest/Node.js. These paths are covered by Playwright E2E.
});
