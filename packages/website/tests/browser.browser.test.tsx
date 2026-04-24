import { test, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { astexplorer, revive } from '../src/store/reducers';

test('Redux store initializes correctly in real browser', () => {
  const store = createStore(astexplorer, revive(undefined));
  const state = store.getState();
  expect(state).toBeTruthy();
  expect(state.showTransformPanel).toBe(false);
});

test('React renders in real browser DOM', () => {
  const store = createStore(astexplorer, revive(undefined));

  function TestApp() {
    return (
      <Provider store={store}>
        <div data-testid="app-root">
          <h1>AST Explorer</h1>
        </div>
      </Provider>
    );
  }

  render(<TestApp />);
  expect(screen.getByTestId('app-root')).toBeTruthy();
  expect(screen.getByText('AST Explorer')).toBeTruthy();
});

test('document and window are real browser objects', () => {
  expect(document).toBeInstanceOf(Document);
  expect(window).toBeInstanceOf(Window);
  // Verify it's NOT jsdom/happy-dom
  expect(navigator.userAgent).toContain('Chrome');
});
