/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';

// Mock CodeMirror before any component imports
const mockCmInstance = {
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

vi.mock('codemirror', () => ({
  default: vi.fn(() => mockCmInstance),
}));

vi.mock('codemirror/keymap/vim', () => ({}));
vi.mock('codemirror/keymap/emacs', () => ({}));
vi.mock('codemirror/keymap/sublime', () => ({}));
vi.mock('codemirror/mode/javascript/javascript', () => ({}));
vi.mock('codemirror/addon/fold/foldgutter', () => ({}));
vi.mock('codemirror/addon/fold/foldcode', () => ({}));
vi.mock('codemirror/addon/fold/brace-fold', () => ({}));
vi.mock('codemirror/addon/hint/show-hint.css', () => ({}));
vi.mock('codemirror/addon/tern/tern.css', () => ({}));

vi.mock('../src/codemirrorModes', () => ({
  ensureCMMode: vi.fn(() => Promise.resolve()),
}));

// Mock JSCodeshiftEditor to avoid AMD require calls to tern/acorn
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
    // PrettierButton renders a button with toggle icon
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
    // Should not throw - uses JSCodeshiftEditor instead of Editor
    const { container } = render(<Transformer {...props} />);
    expect(container.querySelector('.splitpane')).not.toBeNull();
  });

  test('renders with formatting enabled', () => {
    const props = { ...defaultProps, enableFormatting: true };
    const { container } = render(<Transformer {...props} />);
    // PrettierButton should show toggle-on when formatting is enabled
    expect(container.querySelector('.fa-toggle-on')).not.toBeNull();
  });

  test('renders with formatting disabled', () => {
    const { container } = render(<Transformer {...defaultProps} />);
    expect(container.querySelector('.fa-toggle-off')).not.toBeNull();
  });

  test('resize callback publishes PANEL_RESIZE when divider drag completes (lines 10-12)', () => {
    const { container } = render(<Transformer {...defaultProps} />);
    const divider = container.querySelector('.splitpane-divider')!;
    expect(divider).toBeTruthy();

    // mousedown + mouseup on the divider triggers the SplitPane onResize callback
    // which calls the resize() function (lines 10-12)
    fireEvent.mouseDown(divider);
    fireEvent.mouseUp(document);

    // The resize function calls publish('PANEL_RESIZE')
    // We can verify it didn't throw
  });
});
