import { describe, test, expect } from 'vitest';
import cx from '../src/utils/classnames';

describe('cx (classnames)', () => {
  test('passes through plain strings', () => {
    expect(cx('foo')).toBe('foo');
    expect(cx('foo', 'bar')).toBe('foo bar');
  });

  test('includes keys with truthy values from objects', () => {
    expect(cx({ active: true, disabled: false })).toBe('active');
    expect(cx({ a: true, b: true, c: false })).toBe('a b');
  });

  test('combines strings and objects', () => {
    expect(cx('base', { active: true, hidden: false })).toBe('base active');
  });

  test('returns empty string for no args', () => {
    expect(cx()).toBe('');
  });

  test('returns empty string for all-false object', () => {
    expect(cx({ a: false, b: false })).toBe('');
  });

  test('handles multiple objects', () => {
    expect(cx({ a: true }, { b: true })).toBe('a b');
  });

  test('handles empty string inputs', () => {
    expect(cx('', 'foo', '')).toBe(' foo ');
  });
});
