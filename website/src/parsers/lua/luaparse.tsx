import React from 'react';
import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'luaparse/package.json';

type LuaparseParser = typeof import('luaparse');

const ID = 'luaparse';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: `${pkg.version}`,
  homepage: pkg.homepage,
  locationProps: new Set(['range', 'loc']),

  loadParser(callback: (realParser: LuaparseParser) => void) {
    require(['luaparse'], callback);
  },

  parse(luaparse: LuaparseParser, code: string, options={}) {
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

  renderSettings(parserSettings: Partial<Parameters<LuaparseParser['parse']>[1] & object>, onChange: (settings: Partial<Parameters<LuaparseParser['parse']>[1] & object>) => void) {
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
