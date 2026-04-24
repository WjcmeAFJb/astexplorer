/**
 * Semantic token provider for the tree-gex transform editor.
 *
 * Monaco's built-in JavaScript basic-language tokenizer only produces a
 * handful of token classes (keyword / identifier / string / comment / number),
 * which leaves call expressions, property accesses, parameters, and local
 * variables all rendered the same. Patterns written against tree-gex lean
 * heavily on member access (`w.group`, `w.string`) and nested objects, so
 * that single-color identifier rendering reads like plaintext.
 *
 * This module parses the code with acorn and emits richer semantic tokens
 * classifying each identifier as `function`, `parameter`, `property`,
 * `variable`, or `class` (for imported namespaces). Monaco's semantic-tokens
 * pipeline overlays these on top of the basic tokenizer, so keywords,
 * strings, and comments keep their existing colors while identifiers gain
 * distinct colors via a custom theme.
 */

import * as monaco from 'monaco-editor';
import * as acornImport from 'acorn';

// oxlint-disable-next-line typescript-eslint(no-explicit-any)
const acorn: typeof acornImport = (acornImport as any).default ?? acornImport;

type AcornNode = {
  type: string;
  start: number;
  end: number;
  loc?: { start: { line: number; column: number }; end: { line: number; column: number } };
  [key: string]: unknown;
};

// Keep the legend stable — Monaco identifies tokens by index into tokenTypes.
const TOKEN_TYPES = [
  'function',
  'parameter',
  'property',
  'variable',
  'class',
  'namespace',
] as const;

const TOKEN_TYPE_INDEX: Record<(typeof TOKEN_TYPES)[number], number> = {
  function: 0,
  parameter: 1,
  property: 2,
  variable: 3,
  class: 4,
  namespace: 5,
};

type TokenTypeName = keyof typeof TOKEN_TYPE_INDEX;

type Emit = (line: number, col: number, length: number, type: TokenTypeName) => void;

/**
 * Classify each Identifier node in the AST and emit (line, col, length, type)
 * tuples. `line` and `col` are 1/0-based respectively matching acorn's
 * `loc.start`.
 */
function classifyTokens(ast: AcornNode, emit: Emit, paramNames: Set<string>): void {
  function emitIdent(id: AcornNode, type: TokenTypeName): void {
    if (!id.loc) return;
    const length = id.end - id.start;
    emit(id.loc.start.line, id.loc.start.column, length, type);
  }

  function recurse(node: AcornNode, parent: AcornNode | null, parentKey: string | null): void {
    if (!node || typeof node.type !== 'string') return;

    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
      const fn = node;
      const id = fn.id as AcornNode | undefined;
      if (id && id.type === 'Identifier') emitIdent(id, 'function');
      const params = (fn.params as AcornNode[]) ?? [];
      for (const p of params) collectParamNames(p, paramNames);
    }
    if (node.type === 'ArrowFunctionExpression') {
      const params = (node.params as AcornNode[]) ?? [];
      for (const p of params) collectParamNames(p, paramNames);
    }

    if (node.type === 'Identifier') {
      const name = String(node.name);
      const isPropertyKey =
        parent && parent.type === 'Property' && parentKey === 'key' && parent.computed !== true;
      const isMemberProperty =
        parent &&
        parent.type === 'MemberExpression' &&
        parentKey === 'property' &&
        parent.computed !== true;
      const isCallee = parent && parent.type === 'CallExpression' && parentKey === 'callee';
      const isImportSpecifier =
        parent &&
        (parent.type === 'ImportNamespaceSpecifier' ||
          parent.type === 'ImportDefaultSpecifier' ||
          parent.type === 'ImportSpecifier') &&
        parentKey === 'local';

      if (isPropertyKey || isMemberProperty) {
        emitIdent(node, 'property');
      } else if (isImportSpecifier) {
        emitIdent(node, 'namespace');
      } else if (isCallee) {
        emitIdent(node, 'function');
      } else if (paramNames.has(name)) {
        emitIdent(node, 'parameter');
      } else {
        emitIdent(node, 'variable');
      }
    }

    for (const key of Object.keys(node)) {
      if (key === 'type' || key === 'start' || key === 'end' || key === 'loc') continue;
      const child = (node as Record<string, unknown>)[key];
      if (!child || typeof child !== 'object') continue;
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === 'object' && (item as AcornNode).type) {
            recurse(item as AcornNode, node, key);
          }
        }
      } else if (typeof (child as AcornNode).type === 'string') {
        recurse(child as AcornNode, node, key);
      }
    }
  }

  recurse(ast, null, null);
}

function collectParamNames(pattern: AcornNode, out: Set<string>): void {
  if (!pattern || typeof pattern.type !== 'string') return;
  switch (pattern.type) {
    case 'Identifier':
      out.add(String(pattern.name));
      return;
    case 'AssignmentPattern':
      collectParamNames(pattern.left as AcornNode, out);
      return;
    case 'RestElement':
      collectParamNames(pattern.argument as AcornNode, out);
      return;
    case 'ArrayPattern': {
      const elements = (pattern.elements as Array<AcornNode | null>) ?? [];
      for (const e of elements) if (e) collectParamNames(e, out);
      return;
    }
    case 'ObjectPattern': {
      const properties = (pattern.properties as AcornNode[]) ?? [];
      for (const p of properties) {
        if (p.type === 'Property') collectParamNames(p.value as AcornNode, out);
        else if (p.type === 'RestElement') collectParamNames(p.argument as AcornNode, out);
      }
      return;
    }
  }
}

/**
 * Pack the emitted classifications into Monaco's Uint32Array semantic-tokens
 * format: `[deltaLine, deltaChar, length, tokenType, tokenModifierSet]` per
 * token. `deltaLine` is the gap from the previous token's start line (0 for
 * same line), `deltaChar` is the character delta from the previous token's
 * start column when on the same line or the absolute column otherwise.
 */
function pack(
  tokens: Array<{ line: number; col: number; length: number; type: number }>,
): Uint32Array {
  tokens.sort((a, b) => a.line - b.line || a.col - b.col);
  const out = new Uint32Array(tokens.length * 5);
  let prevLine = 0;
  let prevCol = 0;
  let i = 0;
  for (const t of tokens) {
    const deltaLine = t.line - 1 - prevLine;
    const deltaCol = deltaLine === 0 ? t.col - prevCol : t.col;
    out[i++] = deltaLine;
    out[i++] = deltaCol;
    out[i++] = t.length;
    out[i++] = t.type;
    out[i++] = 0;
    prevLine = t.line - 1;
    prevCol = t.col;
  }
  return out;
}

export const TREEGEX_SEMANTIC_LEGEND: monaco.languages.SemanticTokensLegend = {
  tokenTypes: TOKEN_TYPES as unknown as string[],
  tokenModifiers: [],
};

export function createTreegexSemanticProvider(): monaco.languages.DocumentSemanticTokensProvider {
  return {
    getLegend(): monaco.languages.SemanticTokensLegend {
      return TREEGEX_SEMANTIC_LEGEND;
    },
    provideDocumentSemanticTokens(model): monaco.languages.SemanticTokens | null {
      const code = model.getValue();
      let ast: AcornNode;
      try {
        ast = acorn.parse(code, {
          sourceType: 'module',
          ecmaVersion: 'latest',
          locations: true,
          allowReserved: true,
          allowReturnOutsideFunction: true,
          allowHashBang: true,
        }) as unknown as AcornNode;
      } catch {
        return { data: new Uint32Array(0) };
      }

      const tokens: Array<{ line: number; col: number; length: number; type: number }> = [];
      const paramNames = new Set<string>();
      classifyTokens(
        ast,
        (line, col, length, type) => {
          tokens.push({ line, col, length, type: TOKEN_TYPE_INDEX[type] });
        },
        paramNames,
      );
      return { data: pack(tokens) };
    },
    releaseDocumentSemanticTokens(): void {
      // No resources to release.
    },
  };
}

/**
 * Theme rules mapping our semantic token types to VS Code-style colors so
 * function calls, parameters, properties, etc. are visually distinguishable
 * inside the tree-gex transform editor.
 */
export const TREEGEX_THEME_RULES: monaco.editor.ITokenThemeRule[] = [
  { token: 'function', foreground: '795E26' },
  { token: 'parameter', foreground: 'AE9C58' },
  { token: 'property', foreground: '001080' },
  { token: 'variable', foreground: '001080' },
  { token: 'class', foreground: '267F99' },
  { token: 'namespace', foreground: '267F99' },
];
