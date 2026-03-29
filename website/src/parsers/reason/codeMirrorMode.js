/** @typedef {{next: () => string | null, eat: (ch: string) => string | null, peek: () => string}} CMStream */
/** @typedef {{longString?: boolean, tokenize?: ((stream: CMStream, state: CMState) => string | null | false) | null | false}} CMState */
/** @typedef {{defineMIME: (mime: string, config: unknown) => void, registerHelper: (type: string, name: string, data: unknown) => void, defineMode: (name: string, factory: (...args: unknown[]) => unknown, base?: string) => void, getMode: (conf: object, mime: string) => unknown}} CMCodeMirror */

export default function(/** @type {CMCodeMirror} */ CodeMirror) {
  /* https://github.com/facebook/reason/blob/master/src/reason-parser/reason_lexer.mll#L94-L154 */
  const keywords = (
    'and as assert begin class constraint done downto exception external fun ' +
    'esfun function functor include inherit initializer lazy let pub mutable new nonrec ' +
    'object of open or pri rec then to type val virtual' +
    'try catch finally do else for if switch while import library export ' +
    'part of show hide is as'
  ).split(' ');
  const blockKeywords = 'try catch match with else for if switch while do begin end in module sig struct'.split(
    ' ',
  );
  const atoms = 'unit int char exn string int32 int64 float bool option mod land lor lxor lsl lsr asr'.split(
    ' ',
  );
  const builtins = 'true false Error Ok None Some'.split(' ');

  function set(/** @type {string[]} */ words) {
    let obj = {};
    // @ts-expect-error — indexing dynamic object
    for (let i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }

  CodeMirror.defineMIME('application/reason', {
    name: 'clike',
    keywords: set(keywords),
    blockKeywords: set(blockKeywords),
    atoms: set(atoms),
    builtin: set(builtins),

    hooks: {
      '{': function(/** @type {CMStream} */ stream, /** @type {CMState} */ state) {
        if (stream.eat('|')) {
          state.longString = true;
          state.tokenize = tokenLongString;
          return state.tokenize(stream, state);
        }
      },

      // array open [|
      '[': function(/** @type {CMStream} */ stream, /** @type {CMState} */ _state) {
        if (stream.eat('|')) {
          return 'operator';
        }
        return null;
      },
      // array close |]
      '|': function(/** @type {CMStream} */ stream, /** @type {CMState} */ _state) {
        if (stream.eat(']')) {
          return 'operator';
        }
        return 'operator';
      },

      '"': function(/** @type {CMStream} */ stream, /** @type {CMState} */ state) {
        state.tokenize = tokenString;
        return state.tokenize(stream, state);
      },

      "'": function(/** @type {CMStream} */ stream, /** @type {CMState} */ state) {
        state.tokenize = tokenPolymorphicVar;
        return state.tokenize(stream, state);
      },

      '/': function(/** @type {CMStream} */ stream, /** @type {CMState} */ state) {
        if (!stream.eat('*')) return false;
        state.tokenize = tokenNestedComment(1);
        return state.tokenize(stream, state);
      },
    },
  });

  function tokenPolymorphicVar(/** @type {CMStream} */ stream, /** @type {CMState} */ state) {
    /* A char can't have more than 4 characters */
    let count = 0;
    let next; //eslint-disable-line no-unused-vars
    while ((next = stream.next()) != null) {
      // char
      if (stream.eat("'") && count <= 4) {
        state.tokenize = null;
        return 'string';
      }
      // Polymorphic variable
      if (!/\w/.test(stream.peek())) {
        state.tokenize = null;
        return 'variable-2';
      }
      count++;
    }
    state.tokenize = null;
    return null;
  }

  function tokenString(/** @type {CMStream} */ stream, /** @type {CMState} */ state) {
    let next,
      end = false,
      escaped = false;
    while ((next = stream.next()) != null) {
      if (next === '"' && !escaped) {
        end = true;
        break;
      }
      escaped = !escaped && next === '\\';
    }
    if (end && !escaped) {
      state.tokenize = false;
    }
    return 'string';
  }

  function tokenNestedComment(/** @type {number} */ depth) {
    return function(/** @type {CMStream} */ stream, /** @type {CMState} */ state) {
      let ch;
      while ((ch = stream.next())) {
        if (ch == '*' && stream.eat('/')) {
          if (depth == 1) {
            state.tokenize = null;
            break;
          } else {
            state.tokenize = tokenNestedComment(depth - 1);
            return state.tokenize(stream, state);
          }
        } else if (ch == '/' && stream.eat('*')) {
          state.tokenize = tokenNestedComment(depth + 1);
          return state.tokenize(stream, state);
        }
      }
      return 'comment';
    };
  }

  function tokenLongString(/** @type {CMStream} */ stream, /** @type {CMState} */ state) {
    let prev, next;
    while (state.longString && (next = stream.next()) != null) {
      if (prev === '|' && next === '}') state.longString = false;
      prev = next;
    }
    if (!state.longString) {
      state.tokenize = false;
    }
    return 'string';
  }

  CodeMirror.registerHelper(
    'hintWords',
    'application/reason',
    keywords.concat(atoms).concat(builtins),
  );

  CodeMirror.defineMode(
    'reason',
    function(/** @type {object} */ conf) {
      return Object.assign(CodeMirror.getMode(conf, 'application/reason'), {
        lineComment: undefined, // reason doesn't have line comments
      });
    },
    'clike',
  );
}
