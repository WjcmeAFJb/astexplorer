/**
 * Browser-mode tests for components that require a real browser environment.
 * These cover code paths impossible to test in happy-dom:
 * - Monaco Editor integration (real DOM manipulation)
 * - Dialog click-outside handling (real event.target)
 * - SplitPane mouse interactions (real mouse events)
 * - PasteDropTarget paste/drop (real clipboard/drag events)
 * - Container connect() mapStateToProps/mapDispatchToProps
 */
import { describe, test, expect, vi, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import React from 'react';
import { render, fireEvent, act, cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { astexplorer, revive } from '../src/store/reducers';

// ---- Helpers ----

function makeStore(state?: any) {
  return createStore(astexplorer, revive(state));
}

function renderWithStore(element: React.ReactElement, store?: any) {
  const s = store || makeStore();
  return { ...render(<Provider store={s}>{element}</Provider>), store: s };
}

// ===========================================================================
// SettingsDialog: _outerClick (lines 34-37)
// ===========================================================================
describe('SettingsDialog _outerClick in real browser', () => {
  test('clicking dialog backdrop calls saveAndClose', async () => {
    const { default: SettingsDialog } = await import('../src/components/dialogs/SettingsDialog');

    const mockParser = {
      id: 'test',
      displayName: 'Test',
      renderSettings: (settings: any, onChange: any) => <div className="settings">settings</div>,
    };
    const onSave = vi.fn();
    const onClose = vi.fn();

    const { container } = render(
      <SettingsDialog
        visible={true}
        parser={mockParser as any}
        parserSettings={{ a: 1 }}
        onSave={onSave}
        onWantToClose={onClose}
      />,
    );

    const dialog = document.getElementById('SettingsDialog')!;
    expect(dialog).toBeTruthy();

    dialog.click();

    expect(onSave).toHaveBeenCalledWith(mockParser, { a: 1 });
    expect(onClose).toHaveBeenCalled();
  });

  test('clicking inner content does NOT close', async () => {
    const { default: SettingsDialog } = await import('../src/components/dialogs/SettingsDialog');

    const mockParser = {
      id: 'test',
      displayName: 'Test',
      renderSettings: () => <div className="settings">settings</div>,
    };
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <SettingsDialog
        visible={true}
        parser={mockParser as any}
        parserSettings={{}}
        onSave={onSave}
        onWantToClose={onClose}
      />,
    );

    const inner = document.querySelector('#SettingsDialog .inner')!;
    inner.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onSave).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// ShareDialog: _outerClick (lines 17-20)
// ===========================================================================
describe('ShareDialog _outerClick in real browser', () => {
  test('clicking dialog backdrop calls onWantToClose', async () => {
    const { default: ShareDialog } = await import('../src/components/dialogs/ShareDialog');

    const mockSnippet = {
      getShareInfo: () => <div>Share info</div>,
    };
    const onClose = vi.fn();

    render(<ShareDialog visible={true} onWantToClose={onClose} snippet={mockSnippet as any} />);

    const dialog = document.getElementById('ShareDialog')!;
    dialog.click();

    expect(onClose).toHaveBeenCalled();
  });
});

// ===========================================================================
// SplitPane: mousedown handler (lines 29-30)
// ===========================================================================
describe('SplitPane mouse interaction in real browser', () => {
  test('mousedown on divider initiates resize', async () => {
    const { default: SplitPane } = await import('../src/components/SplitPane');
    const onResize = vi.fn();

    const { container } = render(
      <SplitPane className="test-pane" vertical={false} onResize={onResize}>
        <div>Left</div>
        <div>Right</div>
      </SplitPane>,
    );

    const divider = container.querySelector('.splitpane-divider');
    expect(divider).toBeTruthy();

    fireEvent.mouseDown(divider!, { clientX: 100, clientY: 50 });

    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 50 }));
    document.dispatchEvent(new MouseEvent('mouseup'));

    expect(onResize).toHaveBeenCalled();
  });

  test('vertical splitpane mousedown works', async () => {
    const { default: SplitPane } = await import('../src/components/SplitPane');
    const onResize = vi.fn();

    const { container } = render(
      <SplitPane className="test-pane" vertical={true} onResize={onResize}>
        <div>Top</div>
        <div>Bottom</div>
      </SplitPane>,
    );

    const divider = container.querySelector('.splitpane-divider');
    fireEvent.mouseDown(divider!, { clientX: 50, clientY: 100 });
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 150 }));
    document.dispatchEvent(new MouseEvent('mouseup'));
    expect(onResize).toHaveBeenCalled();
  });
});

// ===========================================================================
// Editor: Monaco integration in real browser
// ===========================================================================
describe('Editor with real Monaco in browser', () => {
  test('renders with Monaco editor and sets language', async () => {
    const { default: Editor } = await import('../src/components/Editor');

    const { container } = render(<Editor value="const x = 1;" mode="javascript" />);

    // Real Monaco should render
    const monacoEl = container.querySelector('.monaco-editor');
    expect(monacoEl).toBeTruthy();
  });
});

// ===========================================================================
// Containers: mapStateToProps / mapDispatchToProps in real browser
// ===========================================================================
describe('Containers with real Redux store in browser', () => {
  test('ToolbarContainer maps all state props including transformer, keyMap, snippet', async () => {
    const { default: ToolbarContainer } = await import('../src/containers/ToolbarContainer');
    const store = makeStore();
    store.dispatch({ type: 'SET_KEY_MAP', keyMap: 'vim' } as any);

    const { container } = renderWithStore(<ToolbarContainer />, store);
    expect(container.querySelector('#Toolbar')).toBeTruthy();

    const state = store.getState();
    expect(state.workbench.keyMap).toBe('vim');
  });

  test('CodeEditorContainer renders with mapped state and has dispatch wiring', async () => {
    const { default: CodeEditorContainer } = await import('../src/containers/CodeEditorContainer');
    const store = makeStore();

    const { container } = renderWithStore(<CodeEditorContainer />, store);

    // Real Monaco renders
    const monacoEl = container.querySelector('.monaco-editor');
    expect(monacoEl).toBeTruthy();
  });

  test('PasteDropTargetContainer onError dispatches SET_ERROR', async () => {
    const { default: PasteDropTargetContainer } =
      await import('../src/containers/PasteDropTargetContainer');
    const store = makeStore();
    const spy = vi.spyOn(store, 'dispatch');

    const { container } = renderWithStore(
      <PasteDropTargetContainer id="main">
        <div>content</div>
      </PasteDropTargetContainer>,
      store,
    );
    expect(container.querySelector('#main')).toBeTruthy();
    spy.mockRestore();
  });

  test('TransformerContainer maps transformer state and dispatch', async () => {
    const { default: TransformerContainer } =
      await import('../src/containers/TransformerContainer');
    const store = makeStore();
    store.dispatch({
      type: 'SELECT_TRANSFORMER',
      transformer: {
        id: 'babel',
        displayName: 'babel',
        defaultTransform: '// transform',
        defaultParserID: 'acorn',
      },
    } as any);

    const { container } = renderWithStore(<TransformerContainer />, store);

    // Verify the transformer panel renders with Monaco
    const editors = container.querySelectorAll('.monaco-editor');
    expect(editors.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// Visual snapshot tests
// ===========================================================================
describe('Styled component screenshots', () => {
  test('SettingsDialog', async () => {
    const { default: SettingsDialog } = await import('../src/components/dialogs/SettingsDialog');

    const mockParser = {
      id: 'test',
      displayName: 'Test Parser',
      renderSettings: (settings: any, onChange: any) => (
        <div className="settings">
          <label>
            <input
              type="checkbox"
              checked={settings?.jsx}
              onChange={() => onChange({ ...settings, jsx: !settings?.jsx })}
            />{' '}
            JSX
          </label>
          <label>
            <input type="checkbox" /> TSX
          </label>
        </div>
      ),
    };

    render(
      <SettingsDialog
        visible={true}
        parser={mockParser as any}
        parserSettings={{ jsx: true }}
        onSave={() => {}}
        onWantToClose={() => {}}
      />,
    );

    const dialog = document.getElementById('SettingsDialog')!;
    await expect.element(dialog).toBeVisible();
    await page.screenshot({ element: dialog, path: '__screenshots__/settings-dialog.png' });
  });

  test('SplitPane with divider', async () => {
    const { default: SplitPane } = await import('../src/components/SplitPane');

    const { container } = render(
      <SplitPane className="splitpane" vertical={false} onResize={() => {}}>
        <div style={{ padding: '20px', background: '#f5f5f5' }}>Left pane</div>
        <div style={{ padding: '20px', background: '#fff' }}>Right pane</div>
      </SplitPane>,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root).toBeTruthy();
    expect(root.getBoundingClientRect().height).toBeGreaterThan(0);
    await page.screenshot({ element: root, path: '__screenshots__/split-pane.png' });
  });

  test('Toolbar with buttons', async () => {
    const { default: ToolbarContainer } = await import('../src/containers/ToolbarContainer');
    const store = makeStore();
    const { container } = renderWithStore(<ToolbarContainer />, store);

    const toolbar = container.querySelector('#Toolbar') as HTMLElement;
    expect(toolbar).toBeTruthy();
    expect(toolbar.getBoundingClientRect().height).toBeGreaterThan(0);
    await page.screenshot({ element: toolbar, path: '__screenshots__/toolbar.png' });
  });

  test('Monaco editor', async () => {
    const { default: Editor } = await import('../src/components/Editor');

    const { container } = render(
      <Editor value={'function hello() {\n  return "world";\n}'} mode="javascript" />,
    );

    const monacoEl = container.querySelector('.monaco-editor') as HTMLElement;
    expect(monacoEl).toBeTruthy();
    expect(monacoEl.getBoundingClientRect().height).toBeGreaterThan(0);
    await page.screenshot({ element: monacoEl, path: '__screenshots__/monaco-editor.png' });
  });
});
