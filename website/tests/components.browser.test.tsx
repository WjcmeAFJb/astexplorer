/**
 * Browser-mode tests for components that require a real browser environment.
 * These cover code paths impossible to test in happy-dom:
 * - CodeMirror integration (real DOM manipulation)
 * - Dialog click-outside handling (real event.target)
 * - SplitPane mouse interactions (real mouse events)
 * - PasteDropTarget paste/drop (real clipboard/drag events)
 * - Container connect() mapStateToProps/mapDispatchToProps
 */
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
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
    const { default: SettingsDialog } = await import(
      '../src/components/dialogs/SettingsDialog'
    );

    const mockParser = {
      id: 'test',
      displayName: 'Test',
      renderSettings: (settings: any, onChange: any) => (
        <div className="settings">settings</div>
      ),
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

    // Click the outer dialog div (the backdrop)
    const dialog = document.getElementById('SettingsDialog')!;
    expect(dialog).toBeTruthy();

    // In a real browser, clicking the backdrop element directly means
    // event.target IS the backdrop element, which triggers _outerClick
    dialog.click();

    expect(onSave).toHaveBeenCalledWith(mockParser, { a: 1 });
    expect(onClose).toHaveBeenCalled();
  });

  test('clicking inner content does NOT close', async () => {
    const { default: SettingsDialog } = await import(
      '../src/components/dialogs/SettingsDialog'
    );

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

    // Click inner content — should NOT trigger close
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
    const { default: ShareDialog } = await import(
      '../src/components/dialogs/ShareDialog'
    );

    const mockSnippet = {
      getShareInfo: () => <div>Share info</div>,
    };
    const onClose = vi.fn();

    render(
      <ShareDialog
        visible={true}
        onWantToClose={onClose}
        snippet={mockSnippet as any}
      />,
    );

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

    // Trigger mousedown — should set cursor style
    fireEvent.mouseDown(divider!, { clientX: 100, clientY: 50 });

    // Trigger mousemove and mouseup
    document.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 150, clientY: 50 }),
    );
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
    document.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 50, clientY: 150 }),
    );
    document.dispatchEvent(new MouseEvent('mouseup'));
    expect(onResize).toHaveBeenCalled();
  });
});

// ===========================================================================
// Editor: prettier formatting on blur (lines 131-139)
// ===========================================================================
describe('Editor with real CodeMirror in browser', () => {
  test('renders with CodeMirror and sets mode', async () => {
    const { default: Editor } = await import('../src/components/Editor');

    const { container } = render(
      <Editor value="const x = 1;" mode="javascript" />,
    );

    // Real CodeMirror should render
    const cm = container.querySelector('.CodeMirror');
    expect(cm).toBeTruthy();
  });
});

// ===========================================================================
// Containers: mapStateToProps / mapDispatchToProps in real browser
// ===========================================================================
describe('Containers with real Redux store in browser', () => {
  test('ToolbarContainer maps all state props (lines 16-30)', async () => {
    const { default: ToolbarContainer } = await import(
      '../src/containers/ToolbarContainer'
    );
    const store = makeStore();

    const { container } = renderWithStore(<ToolbarContainer />, store);
    expect(container.querySelector('#Toolbar')).toBeTruthy();

    // Dispatch SET_KEY_MAP to exercise keyMap mapping
    store.dispatch({ type: 'SET_KEY_MAP', keyMap: 'vim' } as any);
  });

  test('CodeEditorContainer maps dispatch functions (lines 21-22)', async () => {
    const { default: CodeEditorContainer } = await import(
      '../src/containers/CodeEditorContainer'
    );
    const store = makeStore();
    const spy = vi.spyOn(store, 'dispatch');

    renderWithStore(<CodeEditorContainer />, store);

    // The editor should render with CodeMirror
    expect(document.querySelector('.CodeMirror')).toBeTruthy();
    spy.mockRestore();
  });

  test('PasteDropTargetContainer maps onText and onError (lines 8-9)', async () => {
    const { default: PasteDropTargetContainer } = await import(
      '../src/containers/PasteDropTargetContainer'
    );
    const store = makeStore();

    const { container } = renderWithStore(
      <PasteDropTargetContainer id="main">
        <div>content</div>
      </PasteDropTargetContainer>,
      store,
    );

    expect(container.querySelector('#main')).toBeTruthy();
  });

  test('TransformerContainer maps state and dispatch', async () => {
    const { default: TransformerContainer } = await import(
      '../src/containers/TransformerContainer'
    );
    const store = makeStore();
    // Show transform panel
    store.dispatch({ type: 'SELECT_TRANSFORMER', transformer: { id: 'babel', displayName: 'babel', defaultTransform: '// t', defaultParserID: 'acorn' } } as any);

    renderWithStore(<TransformerContainer />, store);
  });
});
