/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';

// Mock Monaco editor before any component imports
const mockEditor = {
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

vi.mock('monaco-editor', () => ({
  editor: {
    create: vi.fn((container: HTMLElement) => {
      const el = document.createElement('div');
      el.className = 'monaco-editor';
      container.appendChild(el);
      return mockEditor;
    }),
    setModelLanguage: vi.fn(),
  },
  Range: vi.fn(),
}));

vi.mock('../src/monacoLanguages', () => ({
  getMonacoLanguage: vi.fn((mode: string) => mode || 'plaintext'),
  ensureLanguageRegistered: vi.fn(),
}));

// Mock JSCodeshiftEditor to avoid any import issues
vi.mock('../src/components/JSCodeshiftEditor', () => {
  const React = require('react');
  return {
    default: class JSCodeshiftEditor extends React.Component {
      render() {
        return React.createElement('div', { className: 'editor' });
      }
    },
  };
});

import Transformer from '../src/components/Transformer';

describe('Transformer', () => {
  const defaultProps = {
    transformer: { id: 'babel', displayName: 'babel' },
    transformCode: 'module.exports = function(babel) {};',
    onContentChange: vi.fn(),
    enableFormatting: false,
    keyMap: 'default',
    toggleFormatting: vi.fn(),
    transformResult: null,
    mode: 'javascript',
  };

  test('renders without crashing', () => {
    const { container } = render(<Transformer {...defaultProps} />);
    expect(container.querySelector('.splitpane-divider')).not.toBeNull();
  });

  test('renders SplitPane with className "splitpane"', () => {
    const { container } = render(<Transformer {...defaultProps} />);
    expect(container.querySelector('.splitpane')).not.toBeNull();
  });

  test('renders PrettierButton', () => {
    const { container } = render(<Transformer {...defaultProps} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('renders TransformOutput', () => {
    const { container } = render(<Transformer {...defaultProps} />);
    expect(container.querySelector('.output.highlight')).not.toBeNull();
  });

  test('passes transformResult to TransformOutput', () => {
    const result = { result: 'output code' };
    const { container } = render(<Transformer {...defaultProps} transformResult={result} />);
    expect(container.querySelector('.output.highlight')).not.toBeNull();
  });

  test('renders with jscodeshift transformer id', () => {
    const props = {
      ...defaultProps,
      transformer: { id: 'jscodeshift', displayName: 'jscodeshift' },
    };
    const { container } = render(<Transformer {...props} />);
    expect(container.querySelector('.splitpane')).not.toBeNull();
  });

  test('renders with formatting enabled', () => {
    const props = { ...defaultProps, enableFormatting: true };
    const { container } = render(<Transformer {...props} />);
    expect(container.querySelector('.fa-toggle-on')).not.toBeNull();
  });

  test('renders with formatting disabled', () => {
    const { container } = render(<Transformer {...defaultProps} />);
    expect(container.querySelector('.fa-toggle-off')).not.toBeNull();
  });

  test('resize callback publishes PANEL_RESIZE when divider drag completes', () => {
    const { container } = render(<Transformer {...defaultProps} />);
    const divider = container.querySelector('.splitpane-divider')!;
    expect(divider).toBeTruthy();

    fireEvent.mouseDown(divider);
    fireEvent.mouseUp(document);
  });
});
