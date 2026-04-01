import { describe, test, expect } from 'vitest';
import stringify from '../src/utils/stringify';

describe('stringify', () => {
  test('stringifies strings with JSON escaping', () => {
    expect(stringify('hello')).toBe('"hello"');
    expect(stringify('')).toBe('""');
    expect(stringify('it\'s "quoted"')).toBe('"it\'s \\"quoted\\""');
  });

  test('stringifies numbers', () => {
    expect(stringify(42)).toBe('42');
    expect(stringify(0)).toBe('0');
    expect(stringify(-1.5)).toBe('-1.5');
    expect(stringify(Infinity)).toBe('Infinity');
    expect(stringify(-Infinity)).toBe('-Infinity');
  });

  test('stringifies NaN', () => {
    expect(stringify(NaN)).toBe('NaN');
  });

  test('stringifies booleans', () => {
    expect(stringify(true)).toBe('true');
    expect(stringify(false)).toBe('false');
  });

  test('stringifies null', () => {
    expect(stringify(null)).toBe('null');
  });

  test('stringifies undefined as the string "undefined"', () => {
    const result = stringify(undefined);
    expect(result).toBe('undefined');
    expect(result).not.toBe('null');
    expect(result).not.toBe('');
  });

  test('stringifies functions (signature only)', () => {
    const result = stringify(function foo(a: unknown, b: unknown) { return a; });
    expect(result).toMatch(/^function foo\(/);
    expect(stringify(function() {})).toMatch(/^function\s*\(/);
  });

  test('stringifies plain objects', () => {
    const result = stringify({ a: 1 });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('stringifies arrays', () => {
    const result = stringify([1, 2, 3]);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('stringifies bigint', () => {
    expect(stringify(BigInt(42))).toBe('42');
  });
});
