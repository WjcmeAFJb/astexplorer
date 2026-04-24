import { describe, test, expect } from 'vitest';
import cx from '../src/utils/classnames';

describe('cx (classnames)', () => {
  test('passes through a single string', () => {
    expect(cx('foo')).toBe('foo');
  });

  test('joins multiple strings with space', () => {
    expect(cx('foo', 'bar')).toBe('foo bar');
  });

  test('includes truthy object keys', () => {
    expect(cx({ active: true, disabled: false })).toBe('active');
  });

  test('joins multiple truthy keys', () => {
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
});
