/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

// Mock Monaco editor since JSONEditor uses it
vi.mock('monaco-editor', () => {
  const mockEditor = {
    setValue: vi.fn(),
    getValue: vi.fn(() => ''),
    getScrollTop: vi.fn(() => 0),
    getScrollLeft: vi.fn(() => 0),
    setScrollPosition: vi.fn(),
    layout: vi.fn(),
    dispose: vi.fn(),
    onDidBlurEditorWidget: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeCursorPosition: vi.fn(() => ({ dispose: vi.fn() })),
    deltaDecorations: vi.fn(() => []),
    getModel: vi.fn(() => null),
    getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
    getDomNode: vi.fn(() => document.createElement('div')),
  };
  return {
    editor: {
      create: vi.fn((container: HTMLElement) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'monaco-editor';
        container.appendChild(wrapper);
        return mockEditor;
      }),
      setModelLanguage: vi.fn(),
    },
    Range: vi.fn(),
  };
});

import JSON_Viz from '../src/components/visualization/JSON';

describe('JSON visualization', () => {
  test('renders JSONEditor with stringified AST', () => {
    const ast = { type: 'Program', body: [] };
    const parseResult = { ast };

    const { container } = render(<JSON_Viz parseResult={parseResult} />);

    expect(container.querySelector('#JSONEditor')).toBeTruthy();
  });

  test('handles circular references in AST via json-stringify-safe', () => {
    const ast: any = { type: 'Program' };
    ast.self = ast;
    const parseResult = { ast };

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
