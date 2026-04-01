import { describe, test, expect, vi, beforeEach } from 'vitest';
import { subscribe, publish, clear } from '../src/utils/pubsub';

describe('pubsub', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test('subscribe and publish delivers messages', () => {
    const handler = vi.fn();
    subscribe('test-topic', handler);

    publish('test-topic', { data: 42 });
    vi.runAllTimers();

    expect(handler).toHaveBeenCalledWith({ data: 42 });
  });

  test('publish without data passes undefined', () => {
    const handler = vi.fn();
    subscribe('no-data', handler);

    publish('no-data');
    vi.runAllTimers();

    expect(handler).toHaveBeenCalledWith(undefined);
  });

  test('unsubscribe stops delivery', () => {
    const handler = vi.fn();
    const unsub = subscribe('unsub-test', handler);

    unsub();
    publish('unsub-test', 'should not arrive');
    vi.runAllTimers();

    expect(handler).not.toHaveBeenCalled();
  });

  test('multiple subscribers receive messages', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    subscribe('multi', h1);
    subscribe('multi', h2);

    publish('multi', 'hello');
    vi.runAllTimers();

    expect(h1).toHaveBeenCalledWith('hello');
    expect(h2).toHaveBeenCalledWith('hello');
  });

  test('subscribing same handler twice does not duplicate', () => {
    const handler = vi.fn();
    subscribe('dedup', handler);
    subscribe('dedup', handler);

    publish('dedup', 'once');
    vi.runAllTimers();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('clear unsubscribes multiple handlers', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const unsubs = [
      subscribe('clear-test', h1),
      subscribe('clear-test', h2),
    ];

    clear(unsubs);
    publish('clear-test', 'gone');
    vi.runAllTimers();

    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  test('publishing to topic with no subscribers does not call setTimeout', () => {
    const spy = vi.spyOn(globalThis, 'setTimeout');
    const callsBefore = spy.mock.calls.length;
    publish('nonexistent-topic-xyz', 'data');
    // Should not schedule a timer since there are no subscribers
    expect(spy.mock.calls.length).toBe(callsBefore);
    spy.mockRestore();
  });

  test('publish is async (uses setTimeout)', () => {
    const handler = vi.fn();
    subscribe('async-test', handler);

    publish('async-test', 'data');
    // Handler should NOT be called synchronously
    expect(handler).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(handler).toHaveBeenCalledWith('data');
  });
});
