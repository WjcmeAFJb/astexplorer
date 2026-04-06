/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

// Mock CodeMirror since JSONEditor uses it
vi.mock('codemirror', () => {
  const mockEditor = {
    setValue: vi.fn(),
    getValue: vi.fn(() => ''),
    getScrollInfo: vi.fn(() => ({ left: 0, top: 0 })),
    scrollTo: vi.fn(),
    refresh: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };
  const CodeMirror = vi.fn((container: HTMLElement) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'CodeMirror';
    container.appendChild(wrapper);
    return mockEditor;
  });
  return { default: CodeMirror };
});

vi.mock('codemirror/mode/javascript/javascript', () => ({}));
vi.mock('codemirror/addon/fold/foldgutter', () => ({}));
vi.mock('codemirror/addon/fold/foldcode', () => ({}));
vi.mock('codemirror/addon/fold/brace-fold', () => ({}));

import JSON_Viz from '../src/components/visualization/JSON';

describe('JSON visualization', () => {
  test('renders JSONEditor with stringified AST', () => {
    const ast = { type: 'Program', body: [] };
    const parseResult = { ast };

    const { container } = render(<JSON_Viz parseResult={parseResult} />);

    // Should render a container div for the JSONEditor
    expect(container.querySelector('#JSONEditor')).toBeTruthy();
  });

  test('handles circular references in AST via json-stringify-safe', () => {
    const ast: any = { type: 'Program' };
    ast.self = ast; // circular reference
    const parseResult = { ast };

    // Should not throw
    expect(() => render(<JSON_Viz parseResult={parseResult} />)).not.toThrow();
  });

  test('renders with null AST values', () => {
    const parseResult = { ast: null };
    expect(() => render(<JSON_Viz parseResult={parseResult} />)).not.toThrow();
  });

  test('renders with simple primitive AST', () => {
    const parseResult = { ast: 'hello' };
    expect(() => render(<JSON_Viz parseResult={parseResult} />)).not.toThrow();
  });

  test('renders with nested AST', () => {
    const parseResult = {
      ast: {
        type: 'Program',
        body: [
          {
            type: 'VariableDeclaration',
            declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name: 'x' } }],
          },
        ],
      },
    };

    const { container } = render(<JSON_Viz parseResult={parseResult} />);
    expect(container.querySelector('#JSONEditor')).toBeTruthy();
  });
});
