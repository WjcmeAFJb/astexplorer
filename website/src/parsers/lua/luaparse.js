import React from 'react';
import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'luaparse/package.json';

/**
 * @typedef {{ parse(code: string, options?: object): object }} LuaparseParser
 */

const ID = 'luaparse';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: `${pkg.version}`,
  homepage: pkg.homepage,
  locationProps: new Set(['range', 'loc']),

  loadParser(/** @type {(realParser: Record<string, Function>) => void} */ callback) {
    require(['luaparse'], callback);
  },

  parse(/** @type {Record<string, Function>} */ luaparse, /** @type {string} */ code, options={}) {
    return luaparse.parse(code, options);
  },

  getDefaultOptions() {
    return {
      ranges: true,
      locations: false,
      comments: true,
      scope: false,
      luaVersion: '5.1',
    };
  },

  _getSettingsConfiguration() {
    return {
      fields: [
        'ranges',
        'locations',
        'comments',
        'scope',
        ['luaVersion', ['5.1', '5.2', '5.3']],
      ],
      required: new Set(['ranges']),
    };

  },

  renderSettings(/** @type {Record<string, unknown>} */ parserSettings, /** @type {(settings: Record<string, unknown>) => void} */ onChange) {
    return (
      <div>
        <p>
          <a
            href="https://fstirlitz.github.io/luaparse/#parser-interface"
            target="_blank" rel="noopener noreferrer">
            Option descriptions
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
