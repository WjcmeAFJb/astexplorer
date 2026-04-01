import { describe, test, expect } from 'vitest';
import stringify from '../src/utils/stringify';

describe('stringify', () => {
  test('stringifies strings with JSON quoting', () => {
    expect(stringify('hello')).toBe('"hello"');
    expect(stringify('')).toBe('""');
  });

  test('stringifies numbers', () => {
    expect(stringify(42)).toBe('42');
    expect(stringify(0)).toBe('0');
    expect(stringify(-1.5)).toBe('-1.5');
  });

  test('stringifies NaN as "NaN" not "null"', () => {
    expect(stringify(NaN)).toBe('NaN');
  });

  test('stringifies Infinity', () => {
    expect(stringify(Infinity)).toBe('Infinity');
  });

  test('stringifies booleans', () => {
    expect(stringify(true)).toBe('true');
    expect(stringify(false)).toBe('false');
  });

  test('stringifies null as "null" (object branch, falsy)', () => {
    // null has typeof 'object', so this tests the object branch's ternary
    const result = stringify(null);
    expect(result).toBe('null');
    // Must not fall through to other cases
    expect(result).not.toBe('undefined');
  });

  test('stringifies undefined as "undefined" (not empty, not null)', () => {
    const result = stringify(undefined);
    expect(result).toBe('undefined');
    // Must be distinct from other falsy stringifications
    expect(result).not.toBe('null');
    expect(result).not.toBe('');
    expect(result).not.toBe('false');
  });

  test('stringifies functions showing signature only', () => {
    const result = stringify(function foo(a: unknown, b: unknown) { return a; });
    expect(result).toMatch(/^function foo\(/);
    // Should NOT include body
    expect(result).not.toContain('return');
  });

  test('stringifies anonymous functions', () => {
    expect(stringify(function() {})).toMatch(/^function\s*\(/);
  });

  test('stringifies objects via JSON.stringify', () => {
    const result = stringify({ a: 1 });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    // Object results should not be 'null'
    expect(result).not.toBe('null');
  });

  test('stringifies arrays', () => {
    const result = stringify([1, 2]);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('stringifies bigint', () => {
    expect(stringify(BigInt(99))).toBe('99');
  });

  test('stringifies symbols via JSON.stringify', () => {
    // JSON.stringify(Symbol) returns undefined; typeof that is 'undefined'
    // but stringify handles it via the default case which calls JSON.stringify
    const result = stringify(Symbol('test'));
    // The result is whatever JSON.stringify returns (undefined)
    // stringify's default case returns JSON.stringify(value) which is undefined for symbols
    expect(result).toBeUndefined();
  });
});
