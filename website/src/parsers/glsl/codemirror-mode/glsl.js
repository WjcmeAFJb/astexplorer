/* eslint-disable */
// source: https://github.com/tangrams/GLSL-live-editor/blob/master/src/codemirror/mode/webGL-clike.js

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

/**
 * @typedef {{ next: () => string | null, eat: (ch: string) => string | null, eatWhile: (re: RegExp) => boolean, eatSpace: () => boolean, skipToEnd: () => void, skipTo: (ch: string) => boolean, peek: () => string, current: () => string, sol: () => boolean, eol: () => boolean, indentation: () => number, column: () => number, [k: string]: unknown }} CMStream
 * @typedef {{ tokenize: ((stream: CMStream, state: CMState) => string | null) | null, context: CMContext, indented: number, startOfLine: boolean, longString?: boolean, [k: string]: unknown }} CMState
 * @typedef {{ indented: number, column: number, type: string, align: boolean | null, prev: CMContext | null }} CMContext
 * @typedef {{ keywords?: Record<string, boolean>, builtin?: Record<string, boolean>, blockKeywords?: Record<string, boolean>, atoms?: Record<string, boolean>, hooks?: Record<string, Function>, helperType?: string, [k: string]: unknown }} CMMode
 */

import CodeMirror from 'codemirror';
// @ts-expect-error — dynamic third-party API
CodeMirror.defineMode('clike', function(config, parserConfig) {
  var indentUnit = config.indentUnit,
    statementIndentUnit = parserConfig.statementIndentUnit || indentUnit,
    dontAlignCalls = parserConfig.dontAlignCalls,
    keywords = parserConfig.keywords || {},
    builtin = parserConfig.builtin || {},
    blockKeywords = parserConfig.blockKeywords || {},
    atoms = parserConfig.atoms || {},
    hooks = parserConfig.hooks || {},
    multiLineStrings = parserConfig.multiLineStrings,
    indentStatements = parserConfig.indentStatements !== false;
  var isOperatorChar = /[+\-*&%=<>!?|\/]/;

  var curPunc;

  function tokenBase(/** @type {CMStream} */ stream, /** @type {CMState} */ state) {
    var ch = stream.next();
    if (hooks[ch]) {
      var result = hooks[ch](stream, state);
      if (result !== false) return result;
    }
    if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
      curPunc = ch;
      return null;
    }
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\w\.]/);
      return 'number';
    }
    if (ch == '/') {
      if (stream.eat('*')) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      }
      if (stream.eat('/')) {
        stream.skipToEnd();
        return 'comment';
      }
    }
    if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return 'operator';
    }
    stream.eatWhile(/[\w\$_\xa1-\uffff]/);
    var cur = stream.current();
    if (keywords.propertyIsEnumerable(cur)) {
      if (blockKeywords.propertyIsEnumerable(cur)) curPunc = 'newstatement';
      return 'keyword';
    }
    if (builtin.propertyIsEnumerable(cur)) {
      if (blockKeywords.propertyIsEnumerable(cur)) curPunc = 'newstatement';
      return 'builtin';
    }
    if (atoms.propertyIsEnumerable(cur)) return 'atom';
    return 'variable';
  }

  function tokenString(/** @type {string} */ quote) {
    return function(/** @type {CMStream} */ stream, /** @type {CMState} */ state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {
          end = true;
          break;
        }
        escaped = !escaped && next == '\\';
      }
      if (end || !(escaped || multiLineStrings)) state.tokenize = null;
      return 'string';
    };
  }

  function tokenComment(/** @type {CMStream} */ stream, /** @type {CMState} */ state) {
    var maybeEnd = false, ch;
    while ((ch = stream.next())) {
      if (ch == '/' && maybeEnd) {
        state.tokenize = null;
        break;
      }
      maybeEnd = ch == '*';
    }
    return 'comment';
  }

  function Context(/** @type {number} */ indented, /** @type {number} */ column, /** @type {string} */ type, /** @type {boolean | null} */ align, /** @type {CMContext | null} */ prev) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.align = align;
    this.prev = prev;
  }
  function pushContext(/** @type {CMState} */ state, /** @type {number} */ col, /** @type {string} */ type) {
    var indent = state.indented;
    if (state.context && state.context.type == 'statement')
      indent = state.context.indented;
    return (state.context = new Context(
      indent,
      col,
      type,
      null,
      state.context,
    ));
  }
  function popContext(/** @type {CMState} */ state) {
    var t = state.context.type;
    if (t == ')' || t == ']' || t == '}')
      state.indented = state.context.indented;
    return (state.context = state.context.prev);
  }

  // Interface

  return {
    startState: function(/** @type {number} */ basecolumn) {
      return {
        /** @type {((stream: CMStream, state: CMState) => string | null) | null} */
        tokenize: null,
        context: new Context((basecolumn || 0) - indentUnit, 0, 'top', false),
        indented: 0,
        startOfLine: true,
      };
    },

    token: function(stream, state) {
      var ctx = state.context;
      if (stream.sol()) {
        if (ctx.align == null) ctx.align = false;
        state.indented = stream.indentation();
        state.startOfLine = true;
      }
      if (stream.eatSpace()) return null;
      curPunc = null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == 'comment' || style == 'meta') return style;
      if (ctx.align == null) ctx.align = true;

      if (
        (curPunc == ';' || curPunc == ':' || curPunc == ',') &&
        ctx.type == 'statement'
      )
        popContext(state);
      else if (curPunc == '{') pushContext(state, stream.column(), '}');
      else if (curPunc == '[') pushContext(state, stream.column(), ']');
      else if (curPunc == '(') pushContext(state, stream.column(), ')');
      else if (curPunc == '}') {
        while (ctx.type == 'statement')
          ctx = popContext(state);
        if (ctx.type == '}') ctx = popContext(state);
        while (ctx.type == 'statement')
          ctx = popContext(state);
      } else if (curPunc == ctx.type) popContext(state);
      else if (
        indentStatements &&
        (((ctx.type == '}' || ctx.type == 'top') && curPunc != ';') ||
          (ctx.type == 'statement' && curPunc == 'newstatement'))
      )
        pushContext(state, stream.column(), 'statement');
      state.startOfLine = false;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase && state.tokenize != null)
        return CodeMirror.Pass;
      var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
      if (ctx.type == 'statement' && firstChar == '}') ctx = ctx.prev;
      var closing = firstChar == ctx.type;
      if (ctx.type == 'statement')
        return ctx.indented + (firstChar == '{' ? 0 : statementIndentUnit);
      else if (ctx.align && (!dontAlignCalls || ctx.type != ')'))
        return ctx.column + (closing ? 0 : 1);
      else if (ctx.type == ')' && !closing)
        return ctx.indented + statementIndentUnit;
      else return ctx.indented + (closing ? 0 : indentUnit);
    },

    electricChars: '{}',
    blockCommentStart: '/*',
    blockCommentEnd: '*/',
    lineComment: '//',
    fold: 'brace',
  };
});

function words(/** @type {string} */ str) {
  var obj = {}, words = str.split(' ');
  for (var i = 0; i < words.length; ++i)
    // @ts-expect-error — indexing dynamic object
    obj[words[i]] = true;
  return obj;
}

function cppHook(/** @type {CMStream} */ stream, /** @type {CMState} */ state) {
  if (!state.startOfLine) return false;
  for (;;) {
    if (stream.skipTo('\\')) {
      stream.next();
      if (stream.eol()) {
        state.tokenize = cppHook;
        break;
      }
    } else {
      stream.skipToEnd();
      state.tokenize = null;
      break;
    }
  }
  return 'meta';
}

function def(/** @type {string | string[]} */ mimes, /** @type {CMMode} */ mode) {
  if (typeof mimes == 'string') mimes = [mimes];
  /** @type {string[]} */
  var words = [];
  function add(/** @type {Record<string, boolean> | undefined} */ obj) {
    if (obj)
      for (var prop in obj)
        if (Object.prototype.hasOwnProperty.call(obj, prop)) words.push(prop);
  }
  add(mode.keywords);
  add(mode.builtin);
  add(mode.atoms);
  if (words.length) {
    mode.helperType = mimes[0];
    CodeMirror.registerHelper('hintWords', mimes[0], /** @type {string[]} */ words);
  }

  for (var i = 0; i < mimes.length; ++i)
    CodeMirror.defineMIME(mimes[i], mode);
}

def(['x-shader/x-vertex', 'x-shader/x-fragment'], {
  name: 'clike',
  keywords: words(
    'float int bool void ' +
      'vec2 vec3 vec4 ivec2 ivec3 ivec4 bvec2 bvec3 bvec4 ' +
      'mat2 mat3 mat4 ' +
      'sampler2D sampler3D samplerCube ' +
      'const attribute uniform varying ' +
      'break continue discard return ' +
      'for while do if else struct ' +
      'in out inout',
  ),
  blockKeywords: words('for while do if else struct'),
  builtin: words(
    'radians degrees sin cos tan asin acos atan ' +
      'pow exp log exp2 sqrt inversesqrt ' +
      'abs sign floor ceil fract mod min max clamp mix step smoothstep ' +
      'length distance dot cross normalize faceforward ' +
      'reflect refract matrixCompMult ' +
      'lessThan lessThanEqual greaterThan greaterThanEqual ' +
      'equal notEqual any all not ' +
      'texture2D texture2DLod texture2DProjLod ' +
      'textureCube textureCubeLod ',
  ),
  atoms: words(
    'true false ' +
      'gl_FragColor ' +
      'gl_PointCoord ' +
      'gl_Position gl_PointSize ' +
      'gl_FragCoord gl_FrontFacing ' +
      'gl_FragData ' +
      'gl_DepthRangeParameters ' +
      'gl_MaxVertexAttribs gl_MaxVaryingVectors gl_MaxVertexUniformVectors' +
      'gl_MaxVertexTextureImageUnits gl_MaxTextureImageUnits ' +
      'gl_MaxFragmentUniformVectors ' +
      'gl_MaxDrawBuffers',
  ),
  hooks: { '#': cppHook },
  modeProps: { fold: ['brace', 'include'] },
});
