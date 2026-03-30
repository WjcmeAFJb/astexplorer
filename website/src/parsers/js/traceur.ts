import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'traceur/package.json';

const ID = 'traceur';
const FILENAME = 'astExplorer.js';

class Comment {
  constructor(/** @type {{toString(): string, start: {offset: number, line: number, column: number}, end: {offset: number}}} */ sourceRange) {
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

  loadParser(/** @type {(realParser: {syntax: {SourceFile: new (name: string, code: string) => unknown, Parser: new (sf: unknown, er: unknown, opts: unknown) => Record<string, unknown>}, util: {ErrorReporter: new () => {reportMessageInternal: (...args: unknown[]) => void}, Options: new (opts: Record<string, unknown>) => unknown}}) => void} */ callback) {
    require(['exports-loader?traceur!traceur/bin/traceur'], callback);
  },

  parse(/** @type {{syntax: {SourceFile: new (name: string, code: string) => unknown, Parser: new (sf: unknown, er: unknown, opts: unknown) => Record<string, unknown>}, util: {ErrorReporter: new () => {reportMessageInternal: (...args: unknown[]) => void}, Options: new (opts: Record<string, unknown>) => unknown}}} */ traceur, code: string, options: Record<string, unknown>) {
    let sourceFile = new traceur.syntax.SourceFile(FILENAME, code);
    let errorReporter = new traceur.util.ErrorReporter();
    errorReporter.reportMessageInternal = (/** @type {{start: {offset: number, line: number, column: number}, end: {offset: number}, toString(): string}} */ sourceRange, message: string) => {
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
    let parser = /** @type {{handleComment: (...args: unknown[]) => void, parseScript: () => Record<string, unknown>, parseModule: () => Record<string, unknown>}} */ (new traceur.syntax.Parser(
      sourceFile,
      errorReporter,
      new traceur.util.Options(options),
    ));
    /** @type {Comment[]} */
    let comments = [];
    parser.handleComment = (/** @type {{toString(): string, start: {offset: number, line: number, column: number}, end: {offset: number}}} */ sourceRange) => {
      comments.push(new Comment(sourceRange));
    };
    let ast = options.SourceType === 'Script' ?
      parser.parseScript() :
      parser.parseModule();
    ast.comments = comments;
    return ast;
  },

  getNodeName(/** @type {{constructor: {name: string}, [key: string]: unknown}} */ node) {
    return node.constructor.name;
  },

  *forEachProperty(node: Record<string, unknown>) {
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

  nodeToRange(/** @type {{location?: {start: {offset: number}, end: {offset: number}}, [key: string]: unknown}} */ { location: loc }) {
    if (loc) {
      return [loc.start.offset, loc.end.offset];
    }
  },

  opensByDefault(node: Record<string, unknown>, key: string) {
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

  _getSettingsConfiguration(defaultOptions: Record<string, unknown>) {
    return {
      fields :[
        ['SourceType', ['Script', 'Module']],
        ...Object.keys(defaultOptions).filter(x => x !== 'SourceType'),
      ],
    };
  },
};
