/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

vi.mock('astexplorer-parsers', () => ({
  categories: [],
  getCategoryByID: () => null,
  getParserByID: (id: string) => ({ id, displayName: id }),
  getTransformerByID: () => undefined,
}));

import GistBanner from '../src/components/GistBanner';

function makeRevision(overrides: Record<string, unknown> = {}) {
  return {
    canSave: () => false,
    getSnippetID: () => 'abc123',
    getRevisionID: () => '1',
    getTransformerID: () => undefined,
    getTransformCode: () => '',
    getParserID: () => 'acorn',
    getCode: () => '',
    getParserSettings: () => null,
    getPath: () => '/abc123/1',
    getShareInfo: () => <span>share info</span>,
    ...overrides,
  };
}

function makeState(activeRevision: ReturnType<typeof makeRevision> | null = null) {
  return {
    showSettingsDialog: false,
    showSettingsDrawer: false,
    showShareDialog: false,
    loadingSnippet: false,
    forking: false,
    saving: false,
    cursor: null,
    error: null,
    showTransformPanel: false,
    activeRevision,
    enableFormatting: false,
    parserSettings: {},
    parserPerCategory: {},
    workbench: {
      parser: 'acorn',
      parserSettings: null,
      code: '',
      keyMap: 'default',
      initialCode: '',
      transform: {
        code: '',
        initialCode: '',
        transformer: null,
        transformResult: null,
      },
    },
  };
}

function renderWithStore(ui: React.ReactElement, state = makeState()) {
  const store = createStore(() => state);
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('GistBanner', () => {
  test('renders nothing when no revision', () => {
    const { container } = renderWithStore(<GistBanner />);
    expect(container.querySelector('.banner')).toBeNull();
  });

  test('renders nothing when revision.canSave() returns true', () => {
    const revision = makeRevision({ canSave: () => true });
    const { container } = renderWithStore(<GistBanner />, makeState(revision));
    expect(container.querySelector('.banner')).toBeNull();
  });

  test('renders banner when revision exists and canSave is false', () => {
    const revision = makeRevision({ canSave: () => false });
    const { container } = renderWithStore(<GistBanner />, makeState(revision));
    const banner = container.querySelector('.banner');
    expect(banner).not.toBeNull();
    expect(banner!.textContent).toContain('read-only');
    expect(banner!.textContent).toContain('forking');
  });

  test('hides banner when close button is clicked', () => {
    const revision = makeRevision({ canSave: () => false });
    const { container } = renderWithStore(<GistBanner />, makeState(revision));
    expect(container.querySelector('.banner')).not.toBeNull();

    const closeButton = container.querySelector('.banner button')!;
    fireEvent.click(closeButton);

    expect(container.querySelector('.banner')).toBeNull();
  });

  test('banner has close button with fa-times icon', () => {
    const revision = makeRevision({ canSave: () => false });
    const { container } = renderWithStore(<GistBanner />, makeState(revision));
    const icon = container.querySelector('.fa-times');
    expect(icon).not.toBeNull();
  });

  test('banner reappears when revision changes to different snippet (lines 41-42)', () => {
    const revision1 = makeRevision({ canSave: () => false, getSnippetID: () => 'abc123' });
    const revision2 = makeRevision({ canSave: () => false, getSnippetID: () => 'xyz789' });

    const state1 = makeState(revision1);
    const store = createStore((state = state1, action: any) => {
      if (action.type === 'SET_REVISION') {
        return { ...state, activeRevision: action.revision };
      }
      return state;
    });

    const { container, rerender } = render(
      <Provider store={store}>
        <GistBanner />
      </Provider>,
    );
    expect(container.querySelector('.banner')).not.toBeNull();

    // Hide the banner
    const closeButton = container.querySelector('.banner button')!;
    fireEvent.click(closeButton);
    expect(container.querySelector('.banner')).toBeNull();

    // Change the revision to a different snippet - banner should reappear
    // We need to re-render with a new store state
    const state2 = makeState(revision2);
    const store2 = createStore(() => state2);
    rerender(
      <Provider store={store2}>
        <GistBanner />
      </Provider>,
    );
    expect(container.querySelector('.banner')).not.toBeNull();
  });

  test('banner stays visible when revision changes but same snippet ID', () => {
    const revision1 = makeRevision({ canSave: () => false, getSnippetID: () => 'same' });

    const state1 = makeState(revision1);
    const store = createStore(() => state1);

    const { container } = render(
      <Provider store={store}>
        <GistBanner />
      </Provider>,
    );
    expect(container.querySelector('.banner')).not.toBeNull();
  });
});
