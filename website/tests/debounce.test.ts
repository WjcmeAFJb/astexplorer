import { describe, test, expect, vi, afterEach } from 'vitest';
import debounce from '../src/utils/debounce';

describe('debounce', () => {
  afterEach(() => { vi.useRealTimers(); });

  test('does not call immediately', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d('a');
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('a');
  });

  test('uses latest arguments when called multiple times before timeout', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d('first');
    d('second');
    d('third');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('third');
  });

  test('ignores calls while timer is pending (does not restart timer)', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d('a');
    vi.advanceTimersByTime(50);
    d('b'); // ignored, timer still pending
    vi.advanceTimersByTime(50); // original timer fires
    expect(fn).toHaveBeenCalledTimes(1);
    // Should use latest args though
    expect(fn).toHaveBeenCalledWith('b');
  });

  test('can fire again after timeout completes', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d('first');
    vi.advanceTimersByTime(100);
    d('second');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('second');
  });

  test('preserves this context', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 100);
    const obj = { call: d };
    obj.call();
    vi.advanceTimersByTime(100);
    expect(fn.mock.instances[0]).toBe(obj);
  });
});
