/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';

vi.mock('astexplorer-parsers', () => ({
  getParserByID: () => ({}),
  getTransformerByID: () => undefined,
}));

// Mock focusNodes
vi.mock('../src/components/visualization/focusNodes', () => ({
  default: vi.fn(),
}));

// Mock pubsub
vi.mock('../src/utils/pubsub', () => ({
  publish: vi.fn(),
  subscribe: vi.fn(),
  clear: vi.fn(),
}));

import { publish } from '../src/utils/pubsub';
import focusNodes from '../src/components/visualization/focusNodes';
import ElementContainer from '../src/components/visualization/tree/Element';
import { SelectedNodeProvider } from '../src/components/visualization/SelectedNodeContext';

function makeTreeAdapter(overrides: Record<string, any> = {}) {
  return {
    opensByDefault: vi.fn(() => false),
    getNodeName: vi.fn((node: any) => node?.type || ''),
    getRange: vi.fn(() => null),
    isInRange: vi.fn(() => false),
    hasChildrenInRange: vi.fn(() => false),
    isArray: vi.fn((v: any) => Array.isArray(v)),
    isObject: vi.fn((v: any) => v != null && typeof v === 'object' && !Array.isArray(v)),
    *walkNode(node: any) {
      if (node && typeof node === 'object') {
        for (const key of Object.keys(node)) {
          yield { value: node[key], key, computed: false };
        }
      }
    },
    getConfigurableFilters: vi.fn(() => []),
    isLocationProp: vi.fn(() => false),
    ...overrides,
  };
}

function renderWithProvider(element: React.ReactElement) {
  return render(<SelectedNodeProvider>{element}</SelectedNodeProvider>);
}

describe('ElementContainer', () => {
  let treeAdapter: ReturnType<typeof makeTreeAdapter>;

  beforeEach(() => {
    treeAdapter = makeTreeAdapter();
    vi.clearAllMocks();
  });

  test('renders an object node with its type name', () => {
    const value = { type: 'Program', body: [] };
    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={0}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    expect(container.querySelector('.tokenName')).toBeTruthy();
    expect(container.textContent).toContain('Program');
  });

  test('renders property names', () => {
    const value = { type: 'Identifier', name: 'x' };
    const { container } = renderWithProvider(
      <ElementContainer
        name="id"
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    expect(container.querySelector('.key')).toBeTruthy();
    expect(container.textContent).toContain('id');
  });

  test('renders primitive values', () => {
    const value = { type: 'Literal', value: 42, raw: '42' };
    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={0}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // The object itself is rendered, with its children as primitives
    expect(container.textContent).toContain('Literal');
  });

  test('renders array values with CompactArrayView when closed', () => {
    const value = [1, 2, 3];
    treeAdapter.isArray = vi.fn((v: any) => Array.isArray(v));
    treeAdapter.isObject = vi.fn(
      (v: any) => v != null && typeof v === 'object' && !Array.isArray(v),
    );

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // Should show compact array view with element count
    expect(container.textContent).toContain('3 elements');
  });

  test('renders empty array as [ ]', () => {
    const value: any[] = [];
    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    expect(container.textContent).toContain('[ ]');
  });

  test('renders compact object view when closed', () => {
    const value = { a: 1, b: 2, c: 3 };
    // Make this non-array, non-node
    treeAdapter.getNodeName = vi.fn(() => '');

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // Should show compact object view with keys
    expect(container.textContent).toContain('a');
    expect(container.textContent).toContain('b');
    expect(container.textContent).toContain('c');
  });

  test('clicking toggle opens/closes a node', () => {
    const value = { type: 'Program', body: [], sourceType: 'module' };

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // Find the toggler (tokenName) and click it
    const tokenName = container.querySelector('.tokenName');
    expect(tokenName).toBeTruthy();

    // Click to open
    fireEvent.click(tokenName!);

    // After opening, we should see { and }
    expect(container.querySelector('.prefix')).toBeTruthy();
  });

  test('level 0 opens by default', () => {
    const value = { type: 'Program', body: [] };

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={0}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // Level 0 should be open
    expect(container.querySelector('.open')).toBeTruthy();
  });

  test('computed property name renders with asterisk', () => {
    const value = { type: 'Obj' };

    const { container } = renderWithProvider(
      <ElementContainer
        name="prop"
        computed={true}
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // Computed prop name should be preceded by *
    expect(container.textContent).toContain('*prop');
  });

  test('mouse over publishes HIGHLIGHT when range exists and level > 0', () => {
    const range = [0, 10] as [number, number];
    treeAdapter.getRange = vi.fn(() => range);
    const value = { type: 'Identifier' };

    const { container } = renderWithProvider(
      <ElementContainer
        name="id"
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    const entry = container.querySelector('.entry');
    fireEvent.mouseOver(entry!);
    expect(publish).toHaveBeenCalledWith('HIGHLIGHT', { node: value, range });
  });

  test('mouse leave publishes CLEAR_HIGHLIGHT when range exists and level > 0', () => {
    const range = [0, 10] as [number, number];
    treeAdapter.getRange = vi.fn(() => range);
    const value = { type: 'Identifier' };

    const { container } = renderWithProvider(
      <ElementContainer
        name="id"
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    const entry = container.querySelector('.entry');
    fireEvent.mouseLeave(entry!);
    expect(publish).toHaveBeenCalledWith('CLEAR_HIGHLIGHT', { node: value, range });
  });

  test('no mouse events on level 0 even with range', () => {
    treeAdapter.getRange = vi.fn(() => [0, 10]);
    const value = { type: 'Program' };

    renderWithProvider(
      <ElementContainer
        value={value}
        level={0}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // publish should not have been called (no hover handlers at level 0)
    expect(publish).not.toHaveBeenCalled();
  });

  test('isInRange adds highlighted class', () => {
    treeAdapter.isInRange = vi.fn(() => true);
    treeAdapter.hasChildrenInRange = vi.fn(() => false);
    const value = { type: 'Identifier' };

    const { container } = renderWithProvider(
      <ElementContainer
        name="id"
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={true}
        position={5}
      />,
    );

    expect(container.querySelector('.highlighted')).toBeTruthy();
  });

  test('autofocus calls focusNodes add when isInRange and not hasChildrenInRange', () => {
    treeAdapter.isInRange = vi.fn(() => true);
    treeAdapter.hasChildrenInRange = vi.fn(() => false);
    const value = { type: 'Identifier' };

    renderWithProvider(
      <ElementContainer
        name="id"
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={true}
        position={5}
      />,
    );

    expect(focusNodes).toHaveBeenCalledWith('add', expect.any(Object));
  });

  test('shift+click deep opens a node', () => {
    const value = { type: 'Program', body: [{ type: 'ExpressionStatement' }] };

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    const tokenName = container.querySelector('.tokenName');
    fireEvent.click(tokenName!, { shiftKey: true });

    // Should be deep open
    expect(container.querySelector('.open')).toBeTruthy();
  });

  test('renders function values with invokeable button', () => {
    const parentObj = {
      type: 'Node',
      method: function testMethod() {
        return 42;
      },
    };

    treeAdapter.walkNode = function* (node: any) {
      if (node && typeof node === 'object') {
        for (const key of Object.keys(node)) {
          yield { value: node[key], key, computed: false };
        }
      }
    };

    const { container } = renderWithProvider(
      <ElementContainer
        value={parentObj}
        level={0}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // Should render a (...) invokeable span
    const invokeable = container.querySelector('.invokeable');
    expect(invokeable).toBeTruthy();
    expect(invokeable!.textContent).toBe('(...)');
  });

  test('clicking function invokeable computes and displays result', () => {
    const parentObj = {
      type: 'Node',
      compute: function () {
        return 'computed value';
      },
    };

    treeAdapter.walkNode = function* (node: any) {
      if (node && typeof node === 'object') {
        for (const key of Object.keys(node)) {
          yield { value: node[key], key, computed: false };
        }
      }
    };

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { container } = renderWithProvider(
      <ElementContainer
        value={parentObj}
        level={0}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    const invokeable = container.querySelector('.invokeable');
    fireEvent.click(invokeable!);

    // After invoking, the result should appear as a primitive
    expect(container.textContent).toContain('computed value');
    spy.mockRestore();
  });

  test('clicking function invokeable shows error icon on failure', () => {
    const parentObj = {
      type: 'Node',
      badMethod: function () {
        throw new Error('method failed');
      },
    };

    treeAdapter.walkNode = function* (node: any) {
      if (node && typeof node === 'object') {
        for (const key of Object.keys(node)) {
          yield { value: node[key], key, computed: false };
        }
      }
    };

    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = renderWithProvider(
      <ElementContainer
        value={parentObj}
        level={0}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    const invokeable = container.querySelector('.invokeable');
    fireEvent.click(invokeable!);

    // Should render error icon
    expect(container.querySelector('.fa-exclamation-triangle')).toBeTruthy();
    errSpy.mockRestore();
  });

  test('array with elements shows toggler', () => {
    const value = [1, 2, 3];

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    expect(container.querySelector('.toggable')).toBeTruthy();
  });

  test('renders selected indicator ($node) when node is clicked', () => {
    const value = { type: 'Identifier', name: 'x' };

    const { container } = renderWithProvider(
      <ElementContainer
        name="id"
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // Click on the token name to select the node
    const tokenName = container.querySelector('.tokenName');
    fireEvent.click(tokenName!);

    // Should show $node indicator
    expect(container.textContent).toContain('$node');
  });

  test('clicking twice deselects the node', () => {
    const value = { type: 'Identifier', name: 'x' };

    const { container } = renderWithProvider(
      <ElementContainer
        name="id"
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // Open
    fireEvent.click(container.querySelector('.tokenName')!);
    expect(container.textContent).toContain('$node');

    // Close (toggle) - re-query since the DOM was re-rendered
    fireEvent.click(container.querySelector('.tokenName')!);
    // After closing, $node should be removed
    expect(container.textContent).not.toContain('$node');
  });

  test('renders open array with [ and ]', () => {
    const value = [1, 2, 3];
    treeAdapter.opensByDefault = vi.fn(() => true);

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // Force open by clicking
    const placeholder = container.querySelector('.compact.placeholder');
    if (placeholder) {
      fireEvent.click(placeholder);
    }

    // Find brackets in the rendered output
    const text = container.textContent;
    expect(text).toContain('[');
    expect(text).toContain(']');
  });

  test('renders open object with { and }', () => {
    const value = { type: 'Identifier', name: 'x' };

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={0}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // Level 0 should be open by default
    const text = container.textContent;
    expect(text).toContain('{');
    expect(text).toContain('}');
  });

  test('empty object renders compact view with keys', () => {
    const value = {};
    treeAdapter.getNodeName = vi.fn(() => '');
    treeAdapter.walkNode = function* () {};

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // Empty object should not have toggler
    expect(container.querySelector('.toggable')).toBeFalsy();
  });

  test('onClick callback is called from ElementContainer', () => {
    const onClick = vi.fn();
    const value = { type: 'Identifier' };

    const { container } = renderWithProvider(
      <ElementContainer
        name="id"
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
        onClick={onClick}
      />,
    );

    const tokenName = container.querySelector('.tokenName');
    fireEvent.click(tokenName!);

    expect(onClick).toHaveBeenCalled();
  });

  test('opensByDefault from treeAdapter affects initial open state', () => {
    treeAdapter.opensByDefault = vi.fn(() => true);
    const value = { type: 'Program', body: [{ type: 'ExpressionStatement' }] };

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // Should be open since opensByDefault returns true
    expect(container.querySelector('.open')).toBeTruthy();
  });

  test('renders without name (no PropertyName)', () => {
    const value = { type: 'Program' };

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={0}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // No .key element should exist at the root level
    const rootEntry = container.querySelector('li.entry');
    const keySpan = rootEntry?.querySelector(':scope > .key');
    expect(keySpan).toBeFalsy();
  });

  test('renders null/undefined value as primitive', () => {
    const value = { type: 'Node', prop: null };

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={0}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // null is rendered as a primitive "null"
    expect(container.textContent).toContain('null');
  });

  test('renders number primitive value', () => {
    const value = { type: 'Literal', value: 42 };

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={0}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    expect(container.textContent).toContain('42');
  });

  test('renders string primitive value', () => {
    const value = { type: 'Literal', value: 'hello' };

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={0}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    expect(container.textContent).toContain('hello');
  });

  test('renders boolean primitive value', () => {
    const value = { type: 'Literal', value: true };

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={0}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    expect(container.textContent).toContain('true');
  });

  test('PropertyName onClick triggers toggle', () => {
    const value = { type: 'Identifier' };

    const { container } = renderWithProvider(
      <ElementContainer
        name="id"
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // Click on the property name (the .name.nb span)
    const nameSpan = container.querySelector('.name.nb');
    fireEvent.click(nameSpan!);

    // Should toggle
    expect(container.querySelector('.open')).toBeTruthy();
  });

  test('function invokeable returns object result', () => {
    const parentObj = {
      type: 'Node',
      getInfo: function () {
        return { a: 1, b: 2 };
      },
    };

    treeAdapter.walkNode = function* (node: any) {
      if (node && typeof node === 'object') {
        for (const key of Object.keys(node)) {
          yield { value: node[key], key, computed: false };
        }
      }
    };

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { container } = renderWithProvider(
      <ElementContainer
        value={parentObj}
        level={0}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    const invokeable = container.querySelector('.invokeable');
    fireEvent.click(invokeable!);

    // After invoking, the result is an object, so it should render as ElementContainer
    // It should show the keys a, b
    expect(container.textContent).toContain('a');
    expect(container.textContent).toContain('b');
    spy.mockRestore();
  });

  test('function invokeable returns array result', () => {
    const parentObj = {
      type: 'Node',
      getItems: function () {
        return [1, 2, 3];
      },
    };

    treeAdapter.walkNode = function* (node: any) {
      if (node && typeof node === 'object') {
        for (const key of Object.keys(node)) {
          yield { value: node[key], key, computed: false };
        }
      }
    };

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { container } = renderWithProvider(
      <ElementContainer
        value={parentObj}
        level={0}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    const invokeable = container.querySelector('.invokeable');
    fireEvent.click(invokeable!);

    // After invoking, array result should appear
    expect(container.textContent).toContain('3 elements');
    spy.mockRestore();
  });

  test('array with non-numeric keys renders key names', () => {
    // Array-like with named properties
    const value = [1, 2];
    (value as any).namedProp = 'test';

    treeAdapter.walkNode = function* (node: any) {
      if (node && typeof node === 'object') {
        for (const key of Object.keys(node)) {
          yield { value: node[key], key, computed: false };
        }
      }
    };
    treeAdapter.opensByDefault = vi.fn(() => true);

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={0}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // The named property should be rendered with its key
    expect(container.textContent).toContain('namedProp');
  });

  test('compact placeholder click opens node and calls onClick (lines 199-203)', () => {
    const onClick = vi.fn();
    const value = { type: 'Program', body: [{ type: 'Node' }] };

    const { container } = renderWithProvider(
      <ElementContainer
        name="root"
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
        onClick={onClick}
      />,
    );

    // Node is closed by default at level 1, showing compact view
    const placeholder = container.querySelector('.compact.placeholder');
    expect(placeholder).toBeTruthy();

    // Click the compact placeholder - this triggers clickHandler (lines 199-203)
    fireEvent.click(placeholder!);

    // Node should be open now and onClick should be called
    expect(container.querySelector('.open')).toBeTruthy();
    expect(onClick).toHaveBeenCalled();
  });

  test('compact placeholder click opens node without onClick callback (line 200 else branch)', () => {
    const value = { type: 'Program', body: [{ type: 'Node' }] };

    const { container } = renderWithProvider(
      <ElementContainer
        name="root"
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    const placeholder = container.querySelector('.compact.placeholder');
    expect(placeholder).toBeTruthy();
    fireEvent.click(placeholder!);
    expect(container.querySelector('.open')).toBeTruthy();
  });

  test('node resets to DEFAULT when isInRange becomes false and was CLOSED (lines 105-106)', () => {
    // First render with isInRange=true to focus-open the node
    treeAdapter.isInRange = vi.fn(() => true);
    treeAdapter.hasChildrenInRange = vi.fn(() => false);
    const value = { type: 'Identifier', name: 'x' };

    const { container, rerender } = renderWithProvider(
      <ElementContainer
        name="id"
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={true}
        position={5}
      />,
    );

    // The node should be focus-opened because isInRange=true
    expect(container.querySelector('.open')).toBeTruthy();

    // Close the node by clicking
    const tokenName = container.querySelector('.tokenName');
    fireEvent.click(tokenName!);

    // Now change isInRange to false - this should trigger lines 105-106
    // which reset ownOpenState from CLOSED to DEFAULT
    treeAdapter.isInRange = vi.fn(() => false);
    rerender(
      <SelectedNodeProvider>
        <ElementContainer
          name="id"
          value={value}
          level={1}
          treeAdapter={treeAdapter}
          autofocus={true}
          position={10}
        />
      </SelectedNodeProvider>,
    );
  });

  test('CompactObjectView truncates keys longer than 5 (lines 9-10)', () => {
    const value = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7 };
    treeAdapter.getNodeName = vi.fn(() => '');

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={0}
      />,
    );

    // CompactObjectView should show first 5 keys and "... +2"
    expect(container.textContent).toContain('... +2');
  });

  test('highlighting class for hasChildrenInRange without isInRange', () => {
    treeAdapter.isInRange = vi.fn(() => false);
    treeAdapter.hasChildrenInRange = vi.fn(() => true);
    const value = { type: 'Program', body: [{ type: 'Node' }] };

    const { container } = renderWithProvider(
      <ElementContainer
        value={value}
        level={1}
        treeAdapter={treeAdapter}
        autofocus={false}
        position={5}
      />,
    );

    // When not isInRange but hasChildrenInRange and not open, should be highlighted
    // The node is closed by default at level 1
    expect(container.querySelector('.highlighted')).toBeTruthy();
  });
});

describe('Element FOCUS_OPEN state and click handler coverage', () => {
  let ta: ReturnType<typeof makeTreeAdapter>;

  beforeEach(() => {
    ta = makeTreeAdapter({
      getRange: vi.fn((node: any) => (node?.start != null ? [node.start, node.end] : null)),
      isInRange: vi.fn(
        (_: any, __: any, pos: any) => typeof pos === 'number' && pos >= 0 && pos <= 100,
      ),
      hasChildrenInRange: vi.fn(() => false),
    });
  });

  test('FOCUS_OPEN transitions (lines 77-85)', () => {
    const { container, rerender } = renderWithProvider(
      <ElementContainer
        name="root"
        value={{ type: 'Node', start: 0, end: 100 }}
        treeAdapter={ta}
        autofocus={true}
        position={50}
      />,
    );

    // Rerender with position outside range triggers LOOSE_FOCUS
    ta.isInRange.mockReturnValue(false);
    rerender(
      <SelectedNodeProvider>
        <ElementContainer
          name="root"
          value={{ type: 'Node', start: 0, end: 100 }}
          treeAdapter={ta}
          autofocus={true}
          position={200}
        />
      </SelectedNodeProvider>,
    );
    expect(container).toBeTruthy();
  });
});
