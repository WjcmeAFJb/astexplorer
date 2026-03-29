import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'typescript/package.json';

const ID = 'typescript';
const FILENAME = 'astExplorer.ts';

/** @type {((node: Record<string, unknown>, isTrailing?: boolean) => unknown[] | undefined) | undefined} */
let getComments;
const syntaxKind = {};

// Typescript uses `process` somehow
if (!global.process) {
  // @ts-expect-error — partial stub: only needed so `process` is truthy for TS internals
  global.process = {}
}

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['pos', 'end']),
  typeProps: new Set(['kind']),

  loadParser(/** @type {(realParser: any) => void} */ callback) {
    require(['typescript'], (/** @type {typeof import('typescript')} */ _ts) => {
        // workarounds issue described at https://github.com/Microsoft/TypeScript/issues/18062
        for (const name of Object.keys(_ts.SyntaxKind).filter(x => isNaN(parseInt(x)))) {
            const value = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (_ts.SyntaxKind))[name];
            // @ts-expect-error — indexing dynamic object
            if (!syntaxKind[value]) {
                // @ts-expect-error — indexing dynamic object
                syntaxKind[value] = name;
            }
        }

        callback(_ts);
    });
  },

  parse(/** @type {typeof import('typescript')} */ ts, /** @type {string} */ code, /** @type {{jsx?: boolean, experimentalDecorators?: boolean, experimentalAsyncFunctions?: boolean}} */ options) {
    const compilerHost/*: ts.CompilerHost*/ = {
      fileExists: () => true,
      getCanonicalFileName: (/** @type {string} */ filename) => filename,
      getCurrentDirectory: () => '',
      getDefaultLibFileName: () => 'lib.d.ts',
      getNewLine: () => '\n',
      getSourceFile: (/** @type {string} */ filename) => {
        return ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true);
      },
      /** @returns {undefined} */
      readFile: () => undefined,
      useCaseSensitiveFileNames: () => true,
      /** @returns {undefined} */
      writeFile: () => undefined,
    };

    const filename = FILENAME + (options.jsx ? 'x' : '');

    const program = ts.createProgram([filename], {
      noResolve: true,
      target: ts.ScriptTarget.Latest,
      experimentalDecorators: options.experimentalDecorators,
      experimentalAsyncFunctions: options.experimentalAsyncFunctions,
      jsx: options.jsx ? /** @type {import('typescript').JsxEmit} */ (/** @type {unknown} */ ('preserve')) : undefined,
    }, compilerHost);

    const sourceFile = program.getSourceFile(filename);

    getComments = (/** @type {Record<string, unknown>} */ node, /** @type {boolean | undefined} */ isTrailing) => {
      if (node.parent) {
        const parent = /** @type {{end: number, pos: number, kind: number}} */ (node.parent);
        const nodePos = /** @type {number} */ (isTrailing ? node.end : node.pos);
        const parentPos = isTrailing ? parent.end : parent.pos;

        if (parent.kind === ts.SyntaxKind.SourceFile || nodePos !== parentPos) {
          let comments = isTrailing ?
            ts.getTrailingCommentRanges(sourceFile.text, nodePos) :
            ts.getLeadingCommentRanges(sourceFile.text, nodePos);

          if (Array.isArray(comments)) {
            comments.forEach((comment) => {
              // @ts-expect-error — indexing dynamic object
              comment.type = syntaxKind[comment.kind];
              /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (comment)).text = sourceFile.text.substring(comment.pos, comment.end);
            });

            return comments;
          }
        }
      }
    };

    return sourceFile;
  },

  getNodeName(/** @type {{kind?: number, [key: string]: unknown}} */ node) {
    if (node.kind) {
      // @ts-expect-error — indexing dynamic object
      return syntaxKind[node.kind];
    }
  },

  _ignoredProperties: new Set([
    'file',
    'parent',
  ]),

  *forEachProperty(/** @type {Record<string, unknown>} */ node) {
    if (node && typeof node === 'object') {
      for (let prop in node) {
        if (this._ignoredProperties.has(prop) || prop.charAt(0) === '_') {
          continue;
        }
        yield {
          value: node[prop],
          key: prop,
        };
      }
      if (node.parent) {
        yield {
          value: getComments ? getComments(node) : undefined,
          key: 'leadingComments',
          computed: true,
        };
        yield {
          value: getComments ? getComments(node, true) : undefined,
          key: 'trailingComments',
          computed: true,
        };
      }
    }
  },

  nodeToRange(/** @type {{getStart?: () => number, getEnd?: () => number, pos?: number, end?: number, [key: string]: unknown}} */ node) {
    if (typeof node.getStart === 'function' &&
        typeof node.getEnd === 'function') {
      return [node.getStart(), node.getEnd()];
    } else if (typeof node.pos !== 'undefined' &&
        typeof node.end !== 'undefined') {
      return [node.pos, node.end];
    }
  },

  opensByDefault(/** @type {Record<string, unknown>} */ _, /** @type {string} */ key) {
    return (
      key === 'statements' ||
      key === 'declarationList' ||
      key === 'declarations'
    );
  },

  getDefaultOptions() {
    return {
      experimentalDecorators: true,
      jsx: true,
    };
  },

};
