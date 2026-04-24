// Global test setup — provides astexplorer-parsers mock for all tests.
// This avoids vi.mock() hoisting in individual test files which
// interferes with Stryker's per-test coverage tracking.
import { vi } from 'vitest';

vi.mock('astexplorer-parsers', () => ({
  categories: [
    {
      id: 'javascript',
      displayName: 'JavaScript',
      codeExample: 'var x = 1;',
      parsers: [
        {
          id: 'acorn',
          displayName: 'acorn',
          showInMenu: true,
          category: { id: 'javascript' },
          loadParser: (cb: (p: unknown) => void) => cb({}),
          parse: () => ({ type: 'Program', body: [] }),
          getDefaultOptions: () => ({}),
          getNodeName: () => 'Program',
          nodeToRange: () => null,
          forEachProperty: function* () {},
          _ignoredProperties: new Set(),
          locationProps: new Set(),
          typeProps: new Set(),
          opensByDefault: () => false,
          hasSettings: () => false,
          _getSettingsConfiguration: () => null,
          renderSettings: undefined,
        },
      ],
      transformers: [],
    },
  ],
  getDefaultCategory: () => ({
    id: 'javascript',
    displayName: 'JavaScript',
    parsers: [{ id: 'acorn', displayName: 'acorn', showInMenu: true }],
    transformers: [],
  }),
  getDefaultParser: (cat: { parsers: Array<{ showInMenu: boolean }> }) =>
    cat?.parsers?.find((p: { showInMenu: boolean }) => p.showInMenu) || cat?.parsers?.[0],
  getCategoryByID: (id: string) => ({
    id,
    displayName: id,
    parsers: [{ id: 'default', displayName: 'default', showInMenu: true }],
    transformers: [],
  }),
  getParserByID: (id: string) => ({
    id,
    displayName: id,
    showInMenu: true,
    hasSettings: () => false,
  }),
  getTransformerByID: (id: string) => ({
    id,
    displayName: id,
    defaultTransform: '',
  }),
  configureWasm: () => {},
}));
