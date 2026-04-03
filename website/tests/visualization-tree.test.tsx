/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';

vi.mock('astexplorer-parsers', () => ({
  getParserByID: () => ({}),
  getTransformerByID: () => undefined,
}));

// Mock the CSS import
vi.mock('../src/components/visualization/css/tree.css', () => ({}));

// Mock focusNodes to avoid DOM scrolling issues
vi.mock('../src/components/visualization/focusNodes', () => ({
  default: vi.fn(),
}));

import Tree from '../src/components/visualization/Tree';

function makeTreeAdapter(overrides: Record<string, any> = {}) {
  return {
    opensByDefault: vi.fn(() => false),
    getNodeName: vi.fn((node: any) => node?.type || ''),
    getRange: vi.fn(() => null),
    isInRange: vi.fn(() => false),
    hasChildrenInRange: vi.fn(() => false),
    isArray: vi.fn((v: any) => Array.isArray(v)),
    isObject: vi.fn((v: any) => v && typeof v === 'object' && !Array.isArray(v)),
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

// We need to mock treeAdapterFromParseResult
vi.mock('../src/core/TreeAdapter', () => ({
  treeAdapterFromParseResult: vi.fn((_parseResult: any, _settings: any) => {
    return makeTreeAdapter();
  }),
}));

import { treeAdapterFromParseResult } from '../src/core/TreeAdapter';

describe('Tree component', () => {
  beforeEach(() => {
    window.localStorage.clear();
    (treeAdapterFromParseResult as any).mockImplementation(
      () => makeTreeAdapter(),
    );
  });

  test('renders tree-visualization container', () => {
    const parseResult = {
      ast: { type: 'Program', body: [] },
      treeAdapter: { type: 'default', options: {} },
    };

    const { container } = render(<Tree parseResult={parseResult} position={0} />);
    expect(container.querySelector('.tree-visualization')).toBeTruthy();
  });

  test('renders Autofocus checkbox', () => {
    const parseResult = {
      ast: { type: 'Program', body: [] },
      treeAdapter: { type: 'default', options: {} },
    };

    const { container } = render(<Tree parseResult={parseResult} position={0} />);
    const autofocusCheckbox = container.querySelector('input[name="autofocus"]') as HTMLInputElement;
    expect(autofocusCheckbox).toBeTruthy();
    expect(autofocusCheckbox.type).toBe('checkbox');
  });

  test('Autofocus is checked by default', () => {
    const parseResult = {
      ast: { type: 'Program', body: [] },
      treeAdapter: { type: 'default', options: {} },
    };

    const { container } = render(<Tree parseResult={parseResult} position={0} />);
    const autofocusCheckbox = container.querySelector('input[name="autofocus"]') as HTMLInputElement;
    expect(autofocusCheckbox.checked).toBe(true);
  });

  test('toggling checkbox updates settings and saves to localStorage', () => {
    const parseResult = {
      ast: { type: 'Program', body: [] },
      treeAdapter: { type: 'default', options: {} },
    };

    const { container } = render(<Tree parseResult={parseResult} position={0} />);
    const autofocusCheckbox = container.querySelector('input[name="autofocus"]') as HTMLInputElement;

    fireEvent.click(autofocusCheckbox);

    const stored = JSON.parse(window.localStorage.getItem('tree_settings')!);
    expect(stored.autofocus).toBe(false);
  });

  test('loads settings from localStorage on init', () => {
    window.localStorage.setItem('tree_settings', JSON.stringify({
      autofocus: false,
      hideFunctions: false,
      hideEmptyKeys: true,
      hideLocationData: true,
      hideTypeKeys: true,
    }));

    const parseResult = {
      ast: { type: 'Program', body: [] },
      treeAdapter: { type: 'default', options: {} },
    };

    const { container } = render(<Tree parseResult={parseResult} position={0} />);
    const autofocusCheckbox = container.querySelector('input[name="autofocus"]') as HTMLInputElement;
    expect(autofocusCheckbox.checked).toBe(false);
  });

  test('renders configurable filter checkboxes', () => {
    const adapter = makeTreeAdapter({
      getConfigurableFilters: () => [
        { key: 'hideFunctions', label: 'Hide methods' },
        { key: 'hideEmptyKeys', label: 'Hide empty keys' },
      ],
    });
    (treeAdapterFromParseResult as any).mockImplementation(() => adapter);

    const parseResult = {
      ast: { type: 'Program', body: [] },
      treeAdapter: { type: 'default', options: {} },
    };

    const { container } = render(<Tree parseResult={parseResult} position={0} />);
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    // autofocus + 2 filters
    expect(checkboxes.length).toBe(3);
  });

  test('renders ul element for the tree', () => {
    const parseResult = {
      ast: { type: 'Program', body: [] },
      treeAdapter: { type: 'default', options: {} },
    };

    const { container } = render(<Tree parseResult={parseResult} position={0} />);
    expect(container.querySelector('ul')).toBeTruthy();
  });

  test('renders toolbar div', () => {
    const parseResult = {
      ast: { type: 'Program', body: [] },
      treeAdapter: { type: 'default', options: {} },
    };

    const { container } = render(<Tree parseResult={parseResult} position={0} />);
    expect(container.querySelector('.toolbar')).toBeTruthy();
  });
});
