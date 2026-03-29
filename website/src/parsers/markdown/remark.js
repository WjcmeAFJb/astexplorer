import React from 'react';
import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'remark/package.json';

/**
 * @typedef {{
 *   remark: import('remark').remark,
 *   gfm: typeof import('remark-gfm').default,
 *   directive: typeof import('remark-directive').default,
 *   footnotes: typeof import('remark-footnotes').default,
 *   frontmatter: typeof import('remark-frontmatter').default,
 *   math: typeof import('remark-math').default,
 * }} RemarkParser
 * @typedef {import('unist').Node & { position?: { start: { offset: number }, end: { offset: number } }, children?: RemarkNode[], [key: string]: unknown }} RemarkNode
 */

const ID = 'remark';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['position']),

  loadParser(/** @type {(realParser: RemarkParser) => void} */ callback) {
    require([
      'remark',
      'remark-gfm',
      'remark-directive',
      'remark-footnotes',
      'remark-frontmatter',
      'remark-math',
    ], (
      /** @type {{remark: RemarkParser['remark']}} */ { remark },
      /** @type {{default: RemarkParser['gfm']}} */ { default: gfm },
      /** @type {{default: RemarkParser['directive']}} */ { default: directive },
      /** @type {{default: RemarkParser['footnotes']}} */ { default: footnotes },
      /** @type {{default: RemarkParser['frontmatter']}} */ { default: frontmatter },
      /** @type {{default: RemarkParser['math']}} */ { default: math },
    // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- import type may not resolve
    ) => callback({ remark, gfm, directive, footnotes, frontmatter, math }));
  },

  parse(
    /** @type {{remark: () => {use: (...args: unknown[]) => {parse: (code: string) => unknown}, parse: (code: string) => unknown}, gfm: (...args: unknown[]) => unknown, directive: (...args: unknown[]) => unknown, footnotes: (...args: unknown[]) => unknown, frontmatter: (...args: unknown[]) => unknown, math: (...args: unknown[]) => unknown}} */ { remark, gfm, directive, footnotes, frontmatter, math },
    /** @type {string} */ code,
    /** @type {Record<string, unknown>} */ options,
  ) {
    const plugins = [
      options['remark-gfm'] ? gfm : false,
      options['remark-directive'] ? directive : false,
      options['remark-footnotes'] ? footnotes : false,
      options['remark-frontmatter'] ? [frontmatter, ['yaml', 'toml']] : false,
      options['remark-math'] ? math : false,
    ].filter((plugin) => plugin !== false);
    return remark().use(plugins).parse(code);
  },

  nodeToRange(/** @type {RemarkNode} */ { position }) {
    if (position) {
      return [position.start.offset, position.end.offset];
    }
  },

  opensByDefault(/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
    return key === 'children';
  },

  getDefaultOptions() {
    return {
      'remark-directive': false,
      'remark-footnotes': false,
      'remark-frontmatter': false,
      'remark-gfm': false,
      'remark-math': false,
    };
  },

  renderSettings(/** @type {Record<string, unknown>} */ parserSettings, /** @type {(settings: Record<string, unknown>) => void} */ onChange) {
    return (
      <div>
        <p>
          remark is extended through{' '}
          <a
            href="https://github.com/remarkjs/remark/blob/HEAD/doc/plugins.md"
            target="_blank"
            rel="noreferrer noopener"
          >
            plugins
          </a>
        </p>
        {defaultParserInterface.renderSettings.call(
          this,
          parserSettings,
          onChange,
        )}
      </div>
    );
  },
};
