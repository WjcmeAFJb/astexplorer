/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

import { SelectedNodeProvider, useSelectedNode } from '../src/components/visualization/SelectedNodeContext';

describe('SelectedNodeContext', () => {
  beforeEach(() => {
    delete (globalThis as any).$node;
  });

  test('useSelectedNode throws when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function BadComponent() {
      useSelectedNode();
      return <div />;
    }

    expect(() => render(<BadComponent />)).toThrow(
      'useSelectedNode must be used within a SelectedNodeContext',
    );

    spy.mockRestore();
  });

  test('useSelectedNode returns setSelectedNode function within provider', () => {
    let setNodeFn: any;

    function TestComponent() {
      setNodeFn = useSelectedNode();
      return <div />;
    }

    render(
      <SelectedNodeProvider>
        <TestComponent />
      </SelectedNodeProvider>,
    );

    expect(typeof setNodeFn).toBe('function');
  });

  test('setSelectedNode sets $node on globalThis', () => {
    let setNodeFn: any;

    function TestComponent() {
      setNodeFn = useSelectedNode();
      return <div />;
    }

    render(
      <SelectedNodeProvider>
        <TestComponent />
      </SelectedNodeProvider>,
    );

    const node = { type: 'Identifier', name: 'x' };
    setNodeFn(node);
    expect((globalThis as any).$node).toBe(node);
  });

  test('setSelectedNode with null removes $node from globalThis', () => {
    let setNodeFn: any;

    function TestComponent() {
      setNodeFn = useSelectedNode();
      return <div />;
    }

    render(
      <SelectedNodeProvider>
        <TestComponent />
      </SelectedNodeProvider>,
    );

    // First set a node
    setNodeFn({ type: 'Identifier' });
    expect((globalThis as any).$node).toBeTruthy();

    // Then clear it
    setNodeFn(null);
    expect((globalThis as any).$node).toBeUndefined();
  });

  test('setSelectedNode calls previous unselect callback when new node is set', () => {
    let setNodeFn: any;

    function TestComponent() {
      setNodeFn = useSelectedNode();
      return <div />;
    }

    render(
      <SelectedNodeProvider>
        <TestComponent />
      </SelectedNodeProvider>,
    );

    const unselectCb1 = vi.fn();
    const node1 = { type: 'A' };
    setNodeFn(node1, unselectCb1);
    expect((globalThis as any).$node).toBe(node1);

    const unselectCb2 = vi.fn();
    const node2 = { type: 'B' };
    setNodeFn(node2, unselectCb2);

    // Previous callback should have been called
    expect(unselectCb1).toHaveBeenCalledTimes(1);
    expect((globalThis as any).$node).toBe(node2);
  });

  test('setSelectedNode calls previous unselect callback when null is set', () => {
    let setNodeFn: any;

    function TestComponent() {
      setNodeFn = useSelectedNode();
      return <div />;
    }

    render(
      <SelectedNodeProvider>
        <TestComponent />
      </SelectedNodeProvider>,
    );

    const unselectCb = vi.fn();
    setNodeFn({ type: 'A' }, unselectCb);
    setNodeFn(null);

    expect(unselectCb).toHaveBeenCalledTimes(1);
  });

  test('setSelectedNode with null clears unselectCallback', () => {
    let setNodeFn: any;

    function TestComponent() {
      setNodeFn = useSelectedNode();
      return <div />;
    }

    render(
      <SelectedNodeProvider>
        <TestComponent />
      </SelectedNodeProvider>,
    );

    const unselectCb = vi.fn();
    setNodeFn({ type: 'A' }, unselectCb);
    setNodeFn(null);

    // Setting a new node should NOT call unselectCb again
    setNodeFn({ type: 'B' });
    expect(unselectCb).toHaveBeenCalledTimes(1);
  });

  test('setSelectedNode without callback does not throw', () => {
    let setNodeFn: any;

    function TestComponent() {
      setNodeFn = useSelectedNode();
      return <div />;
    }

    render(
      <SelectedNodeProvider>
        <TestComponent />
      </SelectedNodeProvider>,
    );

    // Should not throw when no callback
    expect(() => setNodeFn({ type: 'X' })).not.toThrow();
    expect(() => setNodeFn(null)).not.toThrow();
  });

  test('SelectedNodeProvider renders children', () => {
    const { getByText } = render(
      <SelectedNodeProvider>
        <span>Child Content</span>
      </SelectedNodeProvider>,
    );
    expect(getByText('Child Content')).toBeTruthy();
  });
});
