import React from 'react';
import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'remark/package.json';
type RemarkNode = import('unist').Node;

type RemarkParser = { remark: typeof import('remark').remark, gfm: typeof import('remark-gfm').default, directive: typeof import('remark-directive').default, footnotes: typeof import('remark-footnotes').default, frontmatter: typeof import('remark-frontmatter').default, math: typeof import('remark-math').default, };

const ID = 'remark';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['position']),

  loadParser(callback: (realParser: RemarkParser) => void) {
    require([
      'remark',
      'remark-gfm',
      'remark-directive',
      'remark-footnotes',
      'remark-frontmatter',
      'remark-math',
    ], (
      { remark }: {remark: RemarkParser['remark']},
      { default: gfm }: {default: RemarkParser['gfm']},
      { default: directive }: {default: RemarkParser['directive']},
      { default: footnotes }: {default: RemarkParser['footnotes']},
      { default: frontmatter }: {default: RemarkParser['frontmatter']},
      { default: math }: {default: RemarkParser['math']},
    // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- import type may not resolve
    ) => callback({ remark, gfm, directive, footnotes, frontmatter, math }));
  },

  parse(
    { remark, gfm, directive, footnotes, frontmatter, math }: RemarkParser,
    code: string,
    options: { 'remark-gfm'?: boolean, 'remark-directive'?: boolean, 'remark-footnotes'?: boolean, 'remark-frontmatter'?: boolean, 'remark-math'?: boolean },
  ) {
    const plugins = [
      options['remark-gfm'] ? gfm : false,
      options['remark-directive'] ? directive : false,
      options['remark-footnotes'] ? footnotes : false,
      options['remark-frontmatter'] ? [frontmatter, ['yaml', 'toml']] : false,
      options['remark-math'] ? math : false,
    ].filter((plugin) => plugin !== false);
    // oxlint-disable-next-line typescript-eslint(no-unsafe-return), typescript-eslint(no-unsafe-member-access), typescript-eslint(no-unsafe-call) -- remark's FrozenProcessor type params mismatch between remark/unified .d.ts
    return remark().use(((plugins as unknown) as Parameters<ReturnType<typeof import('remark').remark>['use']>[0])).parse(code);
  },

  nodeToRange({ position }: RemarkNode) {
    if (position) {
      return [position.start.offset, position.end.offset];
    }
  },

  opensByDefault(node: RemarkNode, key: string) {
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

  renderSettings(parserSettings: { 'remark-gfm'?: boolean, 'remark-directive'?: boolean, 'remark-footnotes'?: boolean, 'remark-frontmatter'?: boolean, 'remark-math'?: boolean }, onChange: (settings: { 'remark-gfm'?: boolean, 'remark-directive'?: boolean, 'remark-footnotes'?: boolean, 'remark-frontmatter'?: boolean, 'remark-math'?: boolean }) => void) {
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
