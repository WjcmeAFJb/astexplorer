/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi, beforeEach, afterEach, afterAll, beforeAll } from 'vitest';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

vi.mock('astexplorer-parsers', () => ({
  getTransformerByID: (id: string) => ({ id, defaultTransform: `// ${id} default`, defaultParserID: 'babel' }),
  getParserByID: (id: string) => ({ id, category: { id: 'javascript', codeExample: '// example', fileExtension: 'js' } }),
}));

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => { server.resetHandlers(); global.location.hash = ''; });
afterAll(() => server.close());

// Must import AFTER vi.mock
import * as parse from '../src/storage/parse';

describe('storage/parse', () => {
  describe('matchesURL', () => {
    test('returns true for parse URL', () => {
      global.location.hash = '#/abc123';
      expect(parse.matchesURL()).toBe(true);
    });

    test('returns true for parse URL with revision', () => {
      global.location.hash = '#/abc123/5';
      expect(parse.matchesURL()).toBe(true);
    });

    test('returns true for parse URL with latest', () => {
      global.location.hash = '#/abc123/latest';
      expect(parse.matchesURL()).toBe(true);
    });

    test('returns false for gist URL', () => {
      global.location.hash = '#/gist/abc';
      expect(parse.matchesURL()).toBe(false);
    });

    test('returns false for empty hash', () => {
      global.location.hash = '';
      expect(parse.matchesURL()).toBe(false);
    });
  });

  describe('owns', () => {
    test('returns false for plain objects', () => {
      expect(parse.owns({})).toBe(false);
      expect(parse.owns(null)).toBe(false);
    });
  });

  describe('create/update/fork', () => {
    test('create rejects with not supported', async () => {
      await expect(parse.create()).rejects.toThrow('not supported');
    });
    test('update rejects with not supported', async () => {
      await expect(parse.update()).rejects.toThrow('not supported');
    });
    test('fork rejects with not supported', async () => {
      await expect(parse.fork()).rejects.toThrow('not supported');
    });
  });

  describe('fetchFromURL', () => {
    test('returns null when no matching hash', async () => {
      global.location.hash = '';
      expect(await parse.fetchFromURL()).toBeNull();
    });

    test('fetches snippet from API', async () => {
      server.use(
        rest.get('*/api/v1/parse/abc/0', (req, res, ctx) =>
          res(ctx.json({ snippetID: 'abc', revisionID: 0, code: 'var x;', parserID: 'esprima' }))
        ),
      );
      global.location.hash = '#/abc';
      const rev = await parse.fetchFromURL();
      expect(rev).toBeTruthy();
      expect(rev!.getSnippetID()).toBe('abc');
      expect(rev!.getCode()).toBe('var x;');
      expect(rev!.canSave()).toBe(false);
    });

    test('fetches with specific revision', async () => {
      server.use(
        rest.get('*/api/v1/parse/abc/5', (req, res, ctx) =>
          res(ctx.json({ snippetID: 'abc', revisionID: 5, code: 'let y;', parserID: 'acorn' }))
        ),
      );
      global.location.hash = '#/abc/5';
      const rev = await parse.fetchFromURL();
      expect(rev!.getRevisionID()).toBe(5);
    });

    test('throws on 404', async () => {
      server.use(
        rest.get('*/api/v1/parse/missing/0', (req, res, ctx) => res(ctx.status(404))),
      );
      global.location.hash = '#/missing';
      await expect(parse.fetchFromURL()).rejects.toThrow("doesn't exist");
    });

    test('throws on server error', async () => {
      server.use(
        rest.get('*/api/v1/parse/err/0', (req, res, ctx) => res(ctx.status(500))),
      );
      global.location.hash = '#/err';
      await expect(parse.fetchFromURL()).rejects.toThrow('Unknown error');
    });
  });

  describe('Revision', () => {
    function makeRevision(data: Record<string, unknown> = {}) {
      // Simulate fetching and constructing Revision via fetchFromURL
      server.use(
        rest.get('*/api/v1/parse/test/0', (req, res, ctx) =>
          res(ctx.json({ snippetID: 'test', revisionID: 0, parserID: 'esprima', ...data }))
        ),
      );
      global.location.hash = '#/test';
      return parse.fetchFromURL();
    }

    test('getPath returns correct path', async () => {
      const rev = (await makeRevision({ revisionID: 3 }))!;
      expect(rev.getPath()).toBe('/test/3');
    });

    test('getPath omits revision 0', async () => {
      const rev = (await makeRevision())!;
      expect(rev.getPath()).toBe('/test');
    });

    test('getTransformerID returns toolID', async () => {
      const rev = (await makeRevision({ toolID: 'babel' }))!;
      expect(rev.getTransformerID()).toBe('babel');
    });

    test('getTransformerID defaults to jscodeshift when transform exists but no toolID', async () => {
      const rev = (await makeRevision({ transform: 'code here' }))!;
      expect(rev.getTransformerID()).toBe('jscodeshift');
    });

    test('getTransformerID returns undefined when no transform', async () => {
      const rev = (await makeRevision())!;
      expect(rev.getTransformerID()).toBeUndefined();
    });

    test('getTransformCode returns stored transform', async () => {
      const rev = (await makeRevision({ transform: 'my transform' }))!;
      expect(rev.getTransformCode()).toBe('my transform');
    });

    test('getTransformCode returns default when toolID set but no transform', async () => {
      const rev = (await makeRevision({ toolID: 'babel' }))!;
      expect(rev.getTransformCode()).toContain('babel');
    });

    test('getTransformCode returns empty when neither', async () => {
      const rev = (await makeRevision())!;
      expect(rev.getTransformCode()).toBe('');
    });

    test('getParserID returns from data', async () => {
      const rev = (await makeRevision({ parserID: 'acorn' }))!;
      expect(rev.getParserID()).toBe('acorn');
    });

    test('getParserID returns from transformer when transformer set', async () => {
      const rev = (await makeRevision({ toolID: 'babel' }))!;
      expect(rev.getParserID()).toBe('babel'); // defaultParserID from mock
    });

    test('getCode returns stored code', async () => {
      const rev = (await makeRevision({ code: 'my code' }))!;
      expect(rev.getCode()).toBe('my code');
    });

    test('getCode falls back to code example', async () => {
      const rev = (await makeRevision({ code: undefined }))!;
      expect(rev.getCode()).toBe('// example');
    });

    test('getParserSettings returns null when no settings', async () => {
      const rev = (await makeRevision())!;
      expect(rev.getParserSettings()).toBeNull();
    });

    test('getParserSettings parses JSON settings', async () => {
      const rev = (await makeRevision({ settings: { esprima: '{"jsx":true}' } }))!;
      expect(rev.getParserSettings()).toEqual({ jsx: true });
    });

    test('getParserSettings returns false when parser not in settings', async () => {
      const rev = (await makeRevision({ settings: { other: '{}' } }))!;
      expect(rev.getParserSettings()).toBe(false);
    });
  });

  describe('updateHash', () => {
    test('sets location hash from revision', async () => {
      const rev = (await (async () => {
        server.use(
          rest.get('*/api/v1/parse/xyz/0', (req, res, ctx) =>
            res(ctx.json({ snippetID: 'xyz', revisionID: 3, parserID: 'acorn' }))
          ),
        );
        global.location.hash = '#/xyz';
        return parse.fetchFromURL();
      })())!;
      parse.updateHash(rev);
      expect(global.location.hash).toContain('xyz/3');
    });

    test('sets hash without revision when rev is 0', async () => {
      server.use(
        rest.get('*/api/v1/parse/abc/0', (req, res, ctx) =>
          res(ctx.json({ snippetID: 'abc', revisionID: 0, parserID: 'acorn' }))
        ),
      );
      global.location.hash = '#/abc';
      const rev = (await parse.fetchFromURL())!;
      parse.updateHash(rev);
      // revisionID is 0, so hash should be just '/abc'
      expect(global.location.hash).toContain('abc');
    });
  });

  describe('Revision getShareInfo', () => {
    test('getShareInfo returns React element with share links', async () => {
      server.use(
        rest.get('*/api/v1/parse/test/0', (req, res, ctx) =>
          res(ctx.json({ snippetID: 'test', revisionID: 5, parserID: 'esprima' }))
        ),
      );
      global.location.hash = '#/test';
      const rev = (await parse.fetchFromURL())!;
      const shareInfo = rev.getShareInfo();

      expect(shareInfo).toBeTruthy();
      expect(shareInfo.type).toBe('div');
      expect(shareInfo.props.className).toBe('shareInfo');

      // Render to check contents
      const React = await import('react');
      const { renderToString } = await import('react-dom/server');
      const html = renderToString(shareInfo);
      expect(html).toContain('https://astexplorer.net/#/gist/test/5');
      expect(html).toContain('https://astexplorer.net/#/gist/test/latest');
      expect(html).toContain('Current Revision');
      expect(html).toContain('Latest Revision');
    });
  });

  describe('fetchFromURL with latest revision', () => {
    test('fetches with latest as revision', async () => {
      server.use(
        rest.get('*/api/v1/parse/abc/latest', (req, res, ctx) =>
          res(ctx.json({ snippetID: 'abc', revisionID: 'latest', parserID: 'acorn' }))
        ),
      );
      global.location.hash = '#/abc/latest';
      const rev = await parse.fetchFromURL();
      expect(rev).toBeTruthy();
      expect(rev!.getRevisionID()).toBe('latest');
    });
  });
});
