import { describe, test, expect, vi, afterEach } from 'vitest';
import { subscribe, publish, clear } from '../src/utils/pubsub';

describe('pubsub', () => {
  afterEach(() => { vi.useRealTimers(); });

  test('delivers published data to subscriber', () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    subscribe('t1', handler);
    publish('t1', { v: 42 });
    vi.runAllTimers();
    expect(handler).toHaveBeenCalledWith({ v: 42 });
  });

  test('delivers undefined when no data provided', () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    subscribe('t2', handler);
    publish('t2');
    vi.runAllTimers();
    expect(handler).toHaveBeenCalledWith(undefined);
  });

  test('unsubscribe stops future delivery', () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    const unsub = subscribe('t3', handler);
    unsub();
    publish('t3', 'x');
    vi.runAllTimers();
    expect(handler).not.toHaveBeenCalled();
  });

  test('multiple subscribers all receive messages', () => {
    vi.useFakeTimers();
    const h1 = vi.fn();
    const h2 = vi.fn();
    subscribe('t4', h1);
    subscribe('t4', h2);
    publish('t4', 'msg');
    vi.runAllTimers();
    expect(h1).toHaveBeenCalledWith('msg');
    expect(h2).toHaveBeenCalledWith('msg');
  });

  test('same handler subscribed twice is only called once', () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    subscribe('t5', handler);
    subscribe('t5', handler); // deduplicated
    publish('t5', 'once');
    vi.runAllTimers();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('clear unsubscribes all provided functions', () => {
    vi.useFakeTimers();
    const h1 = vi.fn();
    const h2 = vi.fn();
    const unsubs = [subscribe('t6', h1), subscribe('t6', h2)];
    clear(unsubs);
    publish('t6', 'gone');
    vi.runAllTimers();
    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  test('publish to topic with no subscribers does not schedule timer', () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(globalThis, 'setTimeout');
    const before = spy.mock.calls.length;
    publish('nonexistent_topic_xyz', 'data');
    expect(spy.mock.calls.length).toBe(before);
    spy.mockRestore();
  });

  test('publish is asynchronous (handler not called synchronously)', () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    subscribe('t7', handler);
    publish('t7', 'data');
    expect(handler).not.toHaveBeenCalled(); // not yet
    vi.runAllTimers();
    expect(handler).toHaveBeenCalledWith('data');
  });

  test('publish delivers to all handlers even if list is iterated', () => {
    vi.useFakeTimers();
    const calls: number[] = [];
    subscribe('t8', () => calls.push(1));
    subscribe('t8', () => calls.push(2));
    subscribe('t8', () => calls.push(3));
    publish('t8');
    vi.runAllTimers();
    expect(calls).toEqual([1, 2, 3]);
  });

  test('inner guard: unsubscribing all handlers before setTimeout fires', () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    const unsub = subscribe('t9', handler);

    publish('t9', 'data'); // schedules setTimeout
    unsub(); // unsubscribe before timer fires — empties the handlers array

    // Now fire the timer — the inner `if (subscribers[topic])` guard
    // should still pass (array exists but is empty), but forEach over
    // empty array does nothing
    vi.runAllTimers();
    expect(handler).not.toHaveBeenCalled();
  });
});
