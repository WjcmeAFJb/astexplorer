import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'traceur/package.json';

const ID = 'traceur';
const FILENAME = 'astExplorer.js';

class Comment {
  constructor(/** @type {Record<string, unknown>} */ sourceRange) {
    this.type = 'COMMENT';
    Object.defineProperty(this, 'location', { value: sourceRange });
    this.value = sourceRange.toString();
  }
}

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['location']),

  loadParser(/** @type {(realParser: Record<string, Function>) => void} */ callback) {
    require(['exports-loader?traceur!traceur/bin/traceur'], callback);
  },

  parse(/** @type {Record<string, Function>} */ traceur, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    let sourceFile = new traceur.syntax.SourceFile(FILENAME, code);
    let errorReporter = new traceur.util.ErrorReporter();
    errorReporter.reportMessageInternal = (/** @type {Record<string, unknown>} */ sourceRange, /** @type {Record<string, unknown>} */ message) => {
      if (options.TolerateErrors) {
        return;
      }
      let { start, end } = sourceRange;
      if (start.offset < end.offset) {
        message += `: ${sourceRange}`;
      }
      let err = new SyntaxError(message);
      // @ts-expect-error — non-standard SyntaxError properties (browser extension)
      err.lineNumber = start.line + 1;
      // @ts-expect-error — non-standard SyntaxError properties (browser extension)
      err.columnNumber = start.column;
      throw err;
    };
    let parser = new traceur.syntax.Parser(
      sourceFile,
      errorReporter,
      new traceur.util.Options(options),
    );
    /** @type {Record<string, unknown>} */
    let comments = [];
    parser.handleComment = (/** @type {Record<string, unknown>} */ sourceRange) => {
      comments.push(new Comment(sourceRange));
    };
    let ast = options.SourceType === 'Script' ?
      parser.parseScript() :
      parser.parseModule();
    ast.comments = /** @type {Record<string, unknown>} */ comments;
    return ast;
  },

  getNodeName(/** @type {Record<string, unknown>} */ node) {
    return node.constructor.name;
  },

  *forEachProperty(/** @type {Record<string, unknown>} */ node) {
    if (node && typeof node === 'object') {
      if ('type' in node) {
        yield {
          value: node.type,
          key: 'type',
        }
      }
      for (let prop in node) {
        if (prop === 'line_' || prop === 'column_') {
          prop = prop.slice(0, -1);
        }
        if (prop === 'type' || prop === 'lineNumberTable') {
          continue;
        }
        yield {
          value: node[prop],
          key: prop,
        }
      }
    }
  },

  nodeToRange(/** @type {Record<string, Function>} */ { location: loc }) {
    if (loc) {
      return [loc.start.offset, loc.end.offset];
    }
  },

  opensByDefault(/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
    return (
      key === 'scriptItemList' ||
      key === 'declarations' ||
      key === 'statements' ||
      key === 'parameters' ||
      Array.isArray(node) && key === 'args' ||
      key === 'binding' ||
      key === 'expression' ||
      key === 'expressions' ||
      key === 'literalToken' ||
      key === 'identifierToken'
    );
  },

  getDefaultOptions() {
    return {
      SourceType: 'Module',
      TolerateErrors: false,
      commentCallback: true,
      annotations: false,
      arrayComprehension: false,
      arrowFunctions: true,
      asyncFunctions: false,
      asyncGenerators: false,
      blockBinding: true,
      classes: true,
      computedPropertyNames: true,
      destructuring: true,
      exponentiation: false,
      exportFromExtended: false,
      forOf: true,
      forOn: false,
      generatorComprehension: false,
      generators: true,
      jsx: true,
      memberVariables: false,
      numericLiterals: true,
      propertyMethods: true,
      propertyNameShorthand: true,
      restParameters: true,
      spread: true,
      templateLiterals: true,
      types: false,
      unicodeEscapeSequences: true,
    };
  },

  _getSettingsConfiguration(/** @type {Record<string, unknown>} */ defaultOptions) {
    return {
      fields :[
        ['SourceType', ['Script', 'Module']],
        ...Object.keys(defaultOptions).filter(x => x !== 'SourceType'),
      ],
    };
  },
};
