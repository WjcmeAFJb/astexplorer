/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

import focusNodes from '../src/components/visualization/focusNodes';

describe('focusNodes', () => {
  beforeEach(() => {
    // Always init first to reset the set
    focusNodes('init');
  });

  test('init resets the node set', () => {
    // Add a node
    const ref = { current: document.createElement('div') };
    focusNodes('add', ref as any);

    // Reinit
    focusNodes('init');

    // Focus with empty set should not throw
    const root = { current: document.createElement('div') };
    expect(() => focusNodes('focus', root as any)).not.toThrow();
  });

  test('add adds a ref to the node set', () => {
    const el = document.createElement('div');
    el.scrollIntoView = vi.fn();
    const ref = { current: el };
    focusNodes('add', ref as any);

    // Focus should scroll the single node into view
    const root = { current: document.createElement('div') };
    focusNodes('focus', root as any);

    expect(el.scrollIntoView).toHaveBeenCalled();
  });

  test('focus with single node scrolls it into view', () => {
    const el = document.createElement('div');
    el.scrollIntoView = vi.fn();
    const ref = { current: el };
    focusNodes('add', ref as any);

    const root = { current: document.createElement('div') };
    focusNodes('focus', root as any);

    expect(el.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  test('focus with no nodes does nothing', () => {
    const root = { current: document.createElement('div') };
    // Should not throw with empty set
    expect(() => focusNodes('focus', root as any)).not.toThrow();
  });

  test('focus with multiple nodes scrolls the closest to center', () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    el1.scrollIntoView = vi.fn();
    el2.scrollIntoView = vi.fn();

    // Mock getBoundingClientRect
    el1.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 100,
      width: 100,
      height: 20,
      top: 100,
      left: 0,
      right: 100,
      bottom: 120,
      toJSON: () => {},
    }));
    el2.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 250,
      width: 100,
      height: 20,
      top: 250,
      left: 0,
      right: 100,
      bottom: 270,
      toJSON: () => {},
    }));

    const rootEl = document.createElement('div');
    rootEl.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 0,
      width: 400,
      height: 400,
      top: 0,
      left: 0,
      right: 400,
      bottom: 400,
      toJSON: () => {},
    }));

    focusNodes('add', { current: el1 } as any);
    focusNodes('add', { current: el2 } as any);

    focusNodes('focus', { current: rootEl } as any);

    // One of them should have scrollIntoView called
    const totalCalls =
      (el1.scrollIntoView as any).mock.calls.length + (el2.scrollIntoView as any).mock.calls.length;
    expect(totalCalls).toBe(1);
  });

  test('focus handles null current refs in multi-node mode', () => {
    const el1 = document.createElement('div');
    el1.scrollIntoView = vi.fn();
    el1.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 100,
      width: 100,
      height: 20,
      top: 100,
      left: 0,
      right: 100,
      bottom: 120,
      toJSON: () => {},
    }));

    const rootEl = document.createElement('div');
    rootEl.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 0,
      width: 400,
      height: 400,
      top: 0,
      left: 0,
      right: 400,
      bottom: 400,
      toJSON: () => {},
    }));

    // Add a null ref and a valid ref
    focusNodes('add', { current: null } as any);
    focusNodes('add', { current: el1 } as any);

    focusNodes('focus', { current: rootEl } as any);

    expect(el1.scrollIntoView).toHaveBeenCalled();
  });

  test('focus catches and logs errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const el = document.createElement('div');
    el.scrollIntoView = vi.fn(() => {
      throw new Error('scroll error');
    });
    focusNodes('add', { current: el } as any);

    const root = { current: document.createElement('div') };
    // Should not throw
    expect(() => focusNodes('focus', root as any)).not.toThrow();

    expect(spy).toHaveBeenCalledWith('Unable to scroll node into view:', 'scroll error');

    spy.mockRestore();
  });

  test('focus with multiple nodes where no closest is found (all null refs)', () => {
    focusNodes('add', { current: null } as any);
    focusNodes('add', { current: null } as any);

    const rootEl = document.createElement('div');
    rootEl.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 0,
      width: 400,
      height: 400,
      top: 0,
      left: 0,
      right: 400,
      bottom: 400,
      toJSON: () => {},
    }));

    // Should not throw even if no closest is found
    expect(() => focusNodes('focus', { current: rootEl } as any)).not.toThrow();
  });

  test('adding same ref multiple times only appears once in set', () => {
    const el = document.createElement('div');
    el.scrollIntoView = vi.fn();
    const ref = { current: el } as any;
    focusNodes('add', ref);
    focusNodes('add', ref);

    const root = { current: document.createElement('div') };
    focusNodes('focus', root as any);

    // Since it's a Set, it should only scroll once (single node path)
    expect(el.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  test('focus picks node closer to vertical center', () => {
    // Root spans 0 to 400, center at (0 + 400) / 2 + 0 = 200
    const rootEl = document.createElement('div');
    rootEl.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 0,
      width: 400,
      height: 400,
      top: 0,
      left: 0,
      right: 400,
      bottom: 400,
      toJSON: () => {},
    }));

    // el1 is at y=190, very close to center=200
    const el1 = document.createElement('div');
    el1.scrollIntoView = vi.fn();
    el1.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 190,
      width: 100,
      height: 20,
      top: 190,
      left: 0,
      right: 100,
      bottom: 210,
      toJSON: () => {},
    }));

    // el2 is at y=500, far from center
    const el2 = document.createElement('div');
    el2.scrollIntoView = vi.fn();
    el2.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 500,
      width: 100,
      height: 20,
      top: 500,
      left: 0,
      right: 100,
      bottom: 520,
      toJSON: () => {},
    }));

    focusNodes('add', { current: el1 } as any);
    focusNodes('add', { current: el2 } as any);

    focusNodes('focus', { current: rootEl } as any);

    expect(el1.scrollIntoView).toHaveBeenCalled();
    expect(el2.scrollIntoView).not.toHaveBeenCalled();
  });
});
