/**
 * @vitest-environment happy-dom
 *
 * Tests for website/src/monacoLanguages.ts
 * The getMonacoLanguage function maps CodeMirror mode names to Monaco language IDs.
 */
import { describe, test, expect, vi } from 'vitest';
import { getMonacoLanguage, ensureLanguageRegistered } from '../src/monacoLanguages';

describe('getMonacoLanguage', () => {
  test('returns plaintext for undefined mode', () => {
    expect(getMonacoLanguage(undefined)).toBe('plaintext');
  });

  test('maps javascript mode', () => {
    expect(getMonacoLanguage('javascript')).toBe('javascript');
  });

  test('maps css mode', () => {
    expect(getMonacoLanguage('css')).toBe('css');
  });

  test('maps text/css alias', () => {
    expect(getMonacoLanguage('text/css')).toBe('css');
  });

  test('maps python mode', () => {
    expect(getMonacoLanguage('python')).toBe('python');
  });

  test('maps go mode', () => {
    expect(getMonacoLanguage('go')).toBe('go');
  });

  test('maps rust mode', () => {
    expect(getMonacoLanguage('rust')).toBe('rust');
  });

  test('maps yaml mode', () => {
    expect(getMonacoLanguage('yaml')).toBe('yaml');
  });

  test('maps clike mode', () => {
    expect(getMonacoLanguage('clike')).toBe('java');
  });

  test('maps text/x-ocaml alias', () => {
    expect(getMonacoLanguage('text/x-ocaml')).toBe('fsharp');
  });

  test('maps text/x-java alias', () => {
    expect(getMonacoLanguage('text/x-java')).toBe('java');
  });

  test('maps text/x-scala alias', () => {
    expect(getMonacoLanguage('text/x-scala')).toBe('scala');
  });

  test('maps htmlmixed mode', () => {
    expect(getMonacoLanguage('htmlmixed')).toBe('html');
  });

  test('maps sql mode', () => {
    expect(getMonacoLanguage('sql')).toBe('sql');
  });

  test('maps lua mode', () => {
    expect(getMonacoLanguage('lua')).toBe('lua');
  });

  test('maps markdown mode', () => {
    expect(getMonacoLanguage('markdown')).toBe('markdown');
  });

  test('maps pug mode', () => {
    expect(getMonacoLanguage('pug')).toBe('pug');
  });

  test('maps php mode', () => {
    expect(getMonacoLanguage('php')).toBe('php');
  });

  test('maps handlebars mode', () => {
    expect(getMonacoLanguage('handlebars')).toBe('handlebars');
  });

  test('maps protobuf mode', () => {
    expect(getMonacoLanguage('protobuf')).toBe('protobuf');
  });

  test('maps vue mode', () => {
    expect(getMonacoLanguage('vue')).toBe('html');
  });

  test('maps webidl mode', () => {
    expect(getMonacoLanguage('webidl')).toBe('plaintext');
  });

  test('maps mllike mode', () => {
    expect(getMonacoLanguage('mllike')).toBe('fsharp');
  });

  test('maps xml mode', () => {
    expect(getMonacoLanguage('xml')).toBe('xml');
  });

  test('returns plaintext for unknown mode', () => {
    expect(getMonacoLanguage('nonexistent-mode')).toBe('plaintext');
  });

  test('accepts object with name property', () => {
    expect(getMonacoLanguage({ name: 'javascript' })).toBe('javascript');
  });

  test('accepts object with name for unknown mode', () => {
    expect(getMonacoLanguage({ name: 'unknown-xyz' })).toBe('plaintext');
  });
});

describe('ensureLanguageRegistered', () => {
  test('returns a Promise', () => {
    const result = ensureLanguageRegistered('javascript');
    expect(result).toBeInstanceOf(Promise);
  });

  test('returns resolved Promise for plaintext', async () => {
    const result = ensureLanguageRegistered('plaintext');
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBeUndefined();
  });

  test('returns same Promise for repeated calls (caching)', () => {
    const first = ensureLanguageRegistered('css');
    const second = ensureLanguageRegistered('css');
    expect(first).toBe(second);
  });

  test('returns resolved Promise for unknown language', async () => {
    const result = ensureLanguageRegistered('nonexistent');
    await expect(result).resolves.toBeUndefined();
  });
});
