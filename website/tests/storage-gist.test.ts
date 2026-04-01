/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi, beforeEach, afterEach, afterAll, beforeAll } from 'vitest';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

vi.mock('astexplorer-parsers', () => ({
  getParserByID: (id: string) => ({ id, category: { id: 'javascript', codeExample: '// js', fileExtension: 'js' } }),
}));

const GIST_DATA = {
  id: 'gist123',
  files: {
    'astexplorer.json': { content: JSON.stringify({ v: 2, parserID: 'acorn', settings: { acorn: { jsx: true } } }) },
    'source.js': { content: 'const x = 1;' },
    'transform.js': { content: 'export default function(file) {}' },
  },
  history: [{ version: 'v1abc' }],
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => { server.resetHandlers(); global.location.hash = ''; });
afterAll(() => server.close());

import * as gist from '../src/storage/gist';

describe('storage/gist', () => {
  describe('matchesURL', () => {
    test('true for gist URL', () => {
      global.location.hash = '#/gist/abc123';
      expect(gist.matchesURL()).toBe(true);
    });

    test('true for gist URL with revision', () => {
      global.location.hash = '#/gist/abc123/v2xyz';
      expect(gist.matchesURL()).toBe(true);
    });

    test('false for parse URL', () => {
      global.location.hash = '#/abc123';
      expect(gist.matchesURL()).toBe(false);
    });

    test('false for empty hash', () => {
      global.location.hash = '';
      expect(gist.matchesURL()).toBe(false);
    });
  });

  describe('owns', () => {
    test('returns false for plain objects', () => {
      expect(gist.owns({})).toBe(false);
    });
  });

  describe('fetchFromURL', () => {
    test('returns null for non-matching hash', async () => {
      global.location.hash = '#/not-gist';
      expect(await gist.fetchFromURL()).toBeNull();
    });

    test('fetches gist from API', async () => {
      server.use(
        rest.get('*/api/v1/gist/gist123', (req, res, ctx) => res(ctx.json(GIST_DATA))),
      );
      global.location.hash = '#/gist/gist123';
      const rev = await gist.fetchFromURL();
      expect(rev).toBeTruthy();
      expect(rev!.getSnippetID()).toBe('gist123');
      expect(rev!.canSave()).toBe(true);
    });

    test('fetches with specific revision', async () => {
      server.use(
        rest.get('*/api/v1/gist/gist123/v2', (req, res, ctx) => res(ctx.json(GIST_DATA))),
      );
      global.location.hash = '#/gist/gist123/v2';
      const rev = await gist.fetchFromURL();
      expect(rev!.getRevisionID()).toBe('v1abc');
    });

    test('throws on 404', async () => {
      server.use(
        rest.get('*/api/v1/gist/missing', (req, res, ctx) => res(ctx.status(404))),
      );
      global.location.hash = '#/gist/missing';
      await expect(gist.fetchFromURL()).rejects.toThrow("doesn't exist");
    });
  });

  describe('create', () => {
    test('posts data and returns revision', async () => {
      server.use(
        rest.post('*/api/v1/gist', async (req, res, ctx) => {
          const body = await req.json();
          expect(body.code).toBe('hello');
          return res(ctx.json(GIST_DATA));
        }),
      );
      const rev = await gist.create({ code: 'hello' } as any);
      expect(rev.getSnippetID()).toBe('gist123');
    });

    test('throws on error response', async () => {
      server.use(
        rest.post('*/api/v1/gist', (req, res, ctx) => res(ctx.status(500))),
      );
      await expect(gist.create({} as any)).rejects.toThrow('Unable to create');
    });
  });

  describe('fork', () => {
    test('posts fork and returns revision', async () => {
      server.use(
        rest.get('*/api/v1/gist/gist123', (req, res, ctx) => res(ctx.json(GIST_DATA))),
        rest.post('*/api/v1/gist/gist123/v1abc', (req, res, ctx) => res(ctx.json(GIST_DATA))),
      );
      // Need a real revision
      global.location.hash = '#/gist/gist123';
      const existing = (await gist.fetchFromURL())!;
      const forked = await gist.fork(existing, { code: 'forked' } as any);
      expect(forked.getSnippetID()).toBe('gist123');
    });
  });

  describe('update', () => {
    test('patches snippet and returns revision', async () => {
      server.use(
        rest.get('*/api/v1/gist/gist123', (req, res, ctx) => res(ctx.json(GIST_DATA))),
        rest.patch('*/api/v1/gist/gist123', (req, res, ctx) => res(ctx.json(GIST_DATA))),
      );
      global.location.hash = '#/gist/gist123';
      const existing = (await gist.fetchFromURL())!;
      const updated = await gist.update(existing, { code: 'updated' } as any);
      expect(updated.getSnippetID()).toBe('gist123');
    });

    test('sets transform=null when removing transformer', async () => {
      // Gist with toolID in config
      const gistWithTool = {
        ...GIST_DATA,
        files: {
          ...GIST_DATA.files,
          'astexplorer.json': { content: JSON.stringify({ v: 2, parserID: 'acorn', toolID: 'jscodeshift', settings: {} }) },
        },
      };
      let patchBody: any;
      server.use(
        rest.get('*/api/v1/gist/gist123', (req, res, ctx) => res(ctx.json(gistWithTool))),
        rest.patch('*/api/v1/gist/gist123', async (req, res, ctx) => {
          patchBody = await req.json();
          return res(ctx.json(gistWithTool));
        }),
      );
      global.location.hash = '#/gist/gist123';
      const existing = (await gist.fetchFromURL())!;
      // update without toolID — should signal transformer removal
      await gist.update(existing, { code: 'x' } as any);
      expect(patchBody.transform).toBeNull();
    });
  });

  describe('Revision', () => {
    async function makeGistRevision(overrides: Record<string, any> = {}) {
      const data = {
        ...GIST_DATA,
        files: { ...GIST_DATA.files, ...overrides.files },
        ...overrides,
      };
      if (overrides.files) data.files = { ...GIST_DATA.files, ...overrides.files };
      server.use(
        rest.get('*/api/v1/gist/gist123', (req, res, ctx) => res(ctx.json(data))),
      );
      global.location.hash = '#/gist/gist123';
      return (await gist.fetchFromURL())!;
    }

    test('getPath returns gist path', async () => {
      const rev = await makeGistRevision();
      expect(rev.getPath()).toBe('/gist/gist123/v1abc');
    });

    test('getParserID returns from config', async () => {
      const rev = await makeGistRevision();
      expect(rev.getParserID()).toBe('acorn');
    });

    test('getTransformCode returns transform.js content', async () => {
      const rev = await makeGistRevision();
      expect(rev.getTransformCode()).toContain('export default');
    });

    test('getTransformCode returns empty when no transform.js', async () => {
      const noTransformGist = {
        ...GIST_DATA,
        files: {
          'astexplorer.json': GIST_DATA.files['astexplorer.json'],
          'source.js': GIST_DATA.files['source.js'],
          // no transform.js
        },
      };
      server.use(
        rest.get('*/api/v1/gist/notx', (req, res, ctx) => res(ctx.json(noTransformGist))),
      );
      global.location.hash = '#/gist/notx';
      const rev = (await gist.fetchFromURL())!;
      expect(rev.getTransformCode()).toBe('');
    });

    test('getCode returns source for v2 config', async () => {
      const rev = await makeGistRevision();
      expect(rev.getCode()).toBe('const x = 1;');
    });

    test('getCode returns code.js for v1 config', async () => {
      const v1Config = JSON.stringify({ v: 1, parserID: 'acorn', settings: {} });
      const rev = await makeGistRevision({
        files: {
          'astexplorer.json': { content: v1Config },
          'code.js': { content: 'v1 code' },
        },
      });
      expect(rev.getCode()).toBe('v1 code');
    });

    test('getCode caches result', async () => {
      const rev = await makeGistRevision();
      const code1 = rev.getCode();
      const code2 = rev.getCode();
      expect(code1).toBe(code2);
    });

    test('getParserSettings returns settings for parser', async () => {
      const rev = await makeGistRevision();
      expect(rev.getParserSettings()).toEqual({ jsx: true });
    });

    test('getTransformerID returns toolID from config', async () => {
      const configWithTool = JSON.stringify({ v: 2, parserID: 'acorn', toolID: 'jscodeshift', settings: {} });
      const rev = await makeGistRevision({
        files: { ...GIST_DATA.files, 'astexplorer.json': { content: configWithTool } },
      });
      expect(rev.getTransformerID()).toBe('jscodeshift');
    });

    test('getTransformerID returns undefined when no toolID', async () => {
      const rev = await makeGistRevision();
      expect(rev.getTransformerID()).toBeUndefined();
    });
  });
});
