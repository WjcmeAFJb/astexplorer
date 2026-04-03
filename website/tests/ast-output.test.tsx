/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';

// Mock visualization components
vi.mock('../src/components/visualization', () => {
  const TreeViz = (props: any) => <div data-testid="tree-viz">Tree: {JSON.stringify(props.parseResult?.ast)}</div>;
  TreeViz.displayName = 'Tree';
  Object.defineProperty(TreeViz, 'name', { value: 'Tree' });

  const JSONViz = (props: any) => <div data-testid="json-viz">JSON</div>;
  JSONViz.displayName = 'JSON';
  Object.defineProperty(JSONViz, 'name', { value: 'JSON' });

  return {
    default: [TreeViz, JSONViz],
  };
});

import ASTOutput from '../src/components/ASTOutput';

describe('ASTOutput', () => {
  test('renders with empty parseResult', () => {
    const { container } = render(<ASTOutput />);
    expect(container.querySelector('.output.highlight')).not.toBeNull();
  });

  test('renders toolbar with visualization buttons', () => {
    const { container } = render(<ASTOutput />);
    const toolbar = container.querySelector('.toolbar')!;
    const buttons = toolbar.querySelectorAll('button');
    expect(buttons.length).toBe(2); // Tree and JSON
    expect(buttons[0].textContent).toBe('Tree');
    expect(buttons[1].textContent).toBe('JSON');
  });

  test('first visualization button is active by default', () => {
    const { container } = render(<ASTOutput />);
    const buttons = container.querySelectorAll('.toolbar button');
    expect(buttons[0].classList.contains('active')).toBe(true);
    expect(buttons[1].classList.contains('active')).toBe(false);
  });

  test('renders error message when parseResult has error', () => {
    const parseResult = { error: { message: 'Unexpected token' } };
    const { container } = render(<ASTOutput parseResult={parseResult} />);
    expect(container.textContent).toContain('Unexpected token');
  });

  test('renders error in monospace font', () => {
    const parseResult = { error: { message: 'Parse error' } };
    const { container } = render(<ASTOutput parseResult={parseResult} />);
    const errorDiv = container.querySelector('[style*="monospace"]') as HTMLElement;
    expect(errorDiv).not.toBeNull();
    expect(errorDiv.style.fontFamily).toBe('monospace');
  });

  test('renders AST visualization when ast is present', () => {
    const parseResult = { ast: { type: 'Program' }, time: 42 };
    const { container } = render(<ASTOutput parseResult={parseResult} />);
    expect(container.querySelector('[data-testid="tree-viz"]')).not.toBeNull();
  });

  test('does not render visualization when no ast and no error', () => {
    const parseResult = {};
    const { container } = render(<ASTOutput parseResult={parseResult} />);
    expect(container.querySelector('[data-testid="tree-viz"]')).toBeNull();
    expect(container.querySelector('[data-testid="json-viz"]')).toBeNull();
  });

  test('clicking second button switches visualization', () => {
    const parseResult = { ast: { type: 'Program' }, time: 10 };
    const { container } = render(<ASTOutput parseResult={parseResult} />);
    const buttons = container.querySelectorAll('.toolbar button');

    fireEvent.click(buttons[1]);

    expect(container.querySelector('[data-testid="json-viz"]')).not.toBeNull();
  });

  test('formatTime shows milliseconds for times < 1000', () => {
    const parseResult = { ast: { type: 'Program' }, time: 42 };
    const { container } = render(<ASTOutput parseResult={parseResult} />);
    expect(container.querySelector('.time')!.textContent).toBe('42ms');
  });

  test('formatTime shows seconds for times >= 1000', () => {
    const parseResult = { ast: { type: 'Program' }, time: 1500 };
    const { container } = render(<ASTOutput parseResult={parseResult} />);
    expect(container.querySelector('.time')!.textContent).toBe('1.50s');
  });

  test('formatTime shows nothing for null time', () => {
    const parseResult = { ast: { type: 'Program' }, time: null };
    const { container } = render(<ASTOutput parseResult={parseResult} />);
    expect(container.querySelector('.time')!.textContent).toBe('');
  });

  test('formatTime shows nothing for zero time', () => {
    const parseResult = { ast: { type: 'Program' }, time: 0 };
    const { container } = render(<ASTOutput parseResult={parseResult} />);
    expect(container.querySelector('.time')!.textContent).toBe('');
  });

  test('passes position prop to visualization', () => {
    const parseResult = { ast: { type: 'Program' }, time: 10 };
    // Just verify it renders without errors with position
    const { container } = render(
      <ASTOutput parseResult={parseResult} position={5} />,
    );
    expect(container.querySelector('[data-testid="tree-viz"]')).not.toBeNull();
  });

  test('ErrorBoundary renders fallback on visualization error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Import the mocked visualization module and replace it with a throwing component
    const vizModule = await import('../src/components/visualization');
    const origVizList = vizModule.default;
    const ThrowingViz = () => { throw new Error('Render error'); };
    ThrowingViz.displayName = 'Tree';
    Object.defineProperty(ThrowingViz, 'name', { value: 'Tree' });
    (vizModule as any).default = [ThrowingViz];

    const parseResult = { ast: { type: 'Program' }, time: 10 };
    const { container } = render(<ASTOutput parseResult={parseResult} />);

    // ErrorBoundary should catch the error and render the fallback
    expect(container.textContent).toContain('An error was caught');
    expect(container.textContent).toContain('filing a bug report');

    // Restore
    (vizModule as any).default = origVizList;
    consoleSpy.mockRestore();
  });
});
