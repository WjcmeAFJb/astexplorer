import React from 'react';
import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'remark/package.json';

const ID = 'remark';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['position']),

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require([
      'remark',
      'remark-gfm',
      'remark-directive',
      'remark-footnotes',
      'remark-frontmatter',
      'remark-math',
    ], (
      { remark },
      { default: gfm },
      { default: directive },
      { default: footnotes },
      { default: frontmatter },
      { default: math },
    ) => callback({ remark, gfm, directive, footnotes, frontmatter, math }));
  },

  parse(
    /** @type {DynModule} */ { remark, gfm, directive, footnotes, frontmatter, math },
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

  nodeToRange(/** @type {DynModule} */ { position }) {
    if (position) {
      return [position.start.offset, position.end.offset];
    }
  },

  opensByDefault(/** @type {ASTNode} */ node, /** @type {string} */ key) {
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
