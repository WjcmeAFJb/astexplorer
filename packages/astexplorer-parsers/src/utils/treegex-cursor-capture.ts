/**
 * Cursor-driven capture group instrumentation for tree-gex transforms.
 *
 * Given the user's tree-gex transform code and a cursor offset inside it,
 * we find the smallest "wrappable" expression under the cursor and rewrite
 * the module source to also run `accumWalkMatch(ast, wrappedPattern)` for
 * capture extraction. The captured AST nodes drive highlighting in the UI.
 *
 * Patterns are often split across helper variables (see the GraphQL example)
 * or embedded in function bodies, so the cursor can land anywhere in the
 * module — not just inside the walker's pattern argument. Wrapping the
 * sub-expression in-place mutates whatever object/helper it belongs to,
 * and the walker's pattern picks up the wrap transitively through its
 * variable references.
 *
 * We rewrite at the ES-module source level so that Babel's transpilation
 * handles the injected statement naturally.
 */

import * as acornImport from 'acorn';

// oxlint-disable-next-line typescript-eslint(no-explicit-any) -- acorn's ESM/CJS dual packaging makes TS disagree
const acorn: typeof acornImport = (acornImport as any).default ?? acornImport;

const CURSOR_GROUP_NAME = '__astexplorerCursorCapture__';
const CURSOR_WRAP_FN = '__astexplorerCursorWrap__';
const CURSOR_MATCHES_EXPORT = '__astexplorerCursorMatches__';
const TG_ALIAS_VAR = '__astexplorerTreeGex__';

export const CURSOR_CAPTURE_NAME = CURSOR_GROUP_NAME;
export const CURSOR_WRAP_GLOBAL = CURSOR_WRAP_FN;
export const CURSOR_MATCHES_NAME = CURSOR_MATCHES_EXPORT;

type AcornNode = {
  type: string;
  start: number;
  end: number;
  [key: string]: unknown;
};

type Walker = {
  name: 'walkReplace' | 'walkMatch' | 'accumWalkMatch';
  call: AcornNode;
  astArgSrc: string;
  patternArgSrc: string;
  patternArgStart: number;
  patternArgEnd: number;
};

/**
 * Is this AST node a "wrappable" expression — i.e., one whose runtime value
 * is a useful pattern piece to wrap in a capture group?
 *
 * Primitive literals (strings, numbers, booleans) don't give AST-node-level
 * matches (group captures the primitive itself, not the AST node containing
 * it). So we prefer object/array/call/identifier over raw literals.
 */
function isWrappable(node: AcornNode): boolean {
  switch (node.type) {
    case 'ObjectExpression':
    case 'ArrayExpression':
    case 'CallExpression':
      return true;
    case 'Identifier':
      // Identifiers in expression position are fine. We filter property keys
      // elsewhere (the walker detects and skips them).
      return true;
    default:
      return false;
  }
}

/**
 * Find the innermost wrappable expression in the whole module that contains
 * the cursor. No walker/pattern-containment restriction — helpers and
 * function bodies are valid targets because the walker picks up wraps
 * transitively through variable references.
 */
function findCursorExpression(ast: AcornNode, cursor: number): AcornNode | null {
  let best: AcornNode | null = null;

  function recurse(node: AcornNode, parent: AcornNode | null, parentKey: string | null): void {
    if (!node || typeof node.type !== 'string') return;
    if (typeof node.start !== 'number' || typeof node.end !== 'number') return;
    if (cursor < node.start || cursor > node.end) return;

    // Skip Identifiers that are property keys (non-computed) or member-expression
    // property names — these aren't wrappable expressions at runtime.
    const skipIdentifier =
      node.type === 'Identifier' &&
      parent &&
      ((parent.type === 'Property' && parentKey === 'key' && parent.computed !== true) ||
        (parent.type === 'MemberExpression' &&
          parentKey === 'property' &&
          parent.computed !== true));

    if (!skipIdentifier && isWrappable(node)) {
      best = node;
    }

    for (const key of Object.keys(node)) {
      if (key === 'type' || key === 'start' || key === 'end' || key === 'loc') continue;
      const child = (node as Record<string, unknown>)[key];
      if (child && typeof child === 'object') {
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
  }

  recurse(ast, null, null);
  return best;
}

/**
 * Pick a tree-gex walker call (accumWalkMatch/walkMatch/walkReplace) whose
 * ast and pattern arguments we can mirror into a parallel accumWalkMatch
 * for capture extraction. Prefer one whose pattern arg transitively contains
 * the cursor; otherwise fall back to the first walker in the module.
 */
function findWalkerCall(ast: AcornNode, code: string, cursor: number): Walker | null {
  let best: Walker | null = null;
  let fallback: Walker | null = null;

  function walkerNameOf(callee: AcornNode): Walker['name'] | null {
    if (callee.type === 'Identifier') {
      const name = String(callee.name);
      if (name === 'walkReplace' || name === 'walkMatch' || name === 'accumWalkMatch') {
        return name;
      }
    }
    if (callee.type === 'MemberExpression' && callee.computed !== true) {
      const prop = callee.property as AcornNode;
      if (prop && prop.type === 'Identifier') {
        const name = String(prop.name);
        if (name === 'walkReplace' || name === 'walkMatch' || name === 'accumWalkMatch') {
          return name;
        }
      }
    }
    return null;
  }

  function makeWalker(node: AcornNode, name: Walker['name']): Walker | null {
    const args = node.arguments as AcornNode[];
    if (!Array.isArray(args) || args.length < 2) return null;
    const astArg = args[0];
    const patternArg = args[1];
    if (!astArg || !patternArg) return null;
    return {
      name,
      call: node,
      astArgSrc: code.slice(astArg.start, astArg.end),
      patternArgSrc: code.slice(patternArg.start, patternArg.end),
      patternArgStart: patternArg.start,
      patternArgEnd: patternArg.end,
    };
  }

  function recurse(node: AcornNode): void {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'CallExpression') {
      const callee = node.callee as AcornNode;
      const name = walkerNameOf(callee);
      if (name) {
        const walker = makeWalker(node, name);
        if (walker) {
          const args = node.arguments as AcornNode[];
          const patternArg = args[1];
          const cursorInPattern =
            typeof patternArg.start === 'number' &&
            typeof patternArg.end === 'number' &&
            cursor >= patternArg.start &&
            cursor <= patternArg.end;
          if (cursorInPattern && !best) best = walker;
          else if (!fallback) fallback = walker;
        }
      }
    }
    for (const key of Object.keys(node)) {
      if (key === 'type' || key === 'start' || key === 'end' || key === 'loc') continue;
      const child = (node as Record<string, unknown>)[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === 'object' && (item as AcornNode).type) {
              recurse(item as AcornNode);
            }
          }
        } else if (typeof (child as AcornNode).type === 'string') {
          recurse(child as AcornNode);
        }
      }
    }
  }

  recurse(ast);
  return best ?? fallback;
}

export type CursorCaptureRewrite = {
  /** Source code to transpile in place of the user's original code. */
  code: string;
  /** Name of the sandbox global used by the rewritten code. */
  wrapGlobal: string;
  /** Export key on the compiled module that contains the capture array. */
  matchesExport: string;
};

/**
 * Build a rewritten module source that:
 *   1. Wraps the sub-expression at `cursor` (anywhere in the module) with
 *      `__cursorWrap(...)`, which returns `group(expr, "__cursorCapture__")` —
 *      a pass-through capture.
 *   2. Appends a mirror `accumWalkMatch(<astArg>, <patternArg>)` export so
 *      captures can be extracted. The mirror reuses the user's walker
 *      arguments by source; any helper variables referenced by that pattern
 *      now carry the wrap transitively.
 *
 * Returns `null` if parsing fails or we can't find both a wrappable
 * expression at the cursor and a walker call to mirror.
 */
export function buildCursorRewrite(code: string, cursor: number): CursorCaptureRewrite | null {
  if (typeof cursor !== 'number' || cursor < 0) return null;

  let ast: AcornNode;
  try {
    ast = acorn.parse(code, {
      sourceType: 'module',
      ecmaVersion: 'latest',
      locations: false,
      ranges: false,
      allowReserved: true,
      allowReturnOutsideFunction: true,
      allowHashBang: true,
    }) as unknown as AcornNode;
  } catch {
    return null;
  }

  const cursorExpr = findCursorExpression(ast, cursor);
  if (!cursorExpr) return null;

  const walker = findWalkerCall(ast, code, cursor);
  if (!walker) return null;

  // Wrap the sub-expression in-place. When the wrap is inside the walker's
  // pattern, the walker sees it directly. When the wrap is in a helper that
  // the pattern references by identifier, the wrap propagates through the
  // reference at evaluation time.
  const firstWrap =
    code.slice(0, cursorExpr.start) +
    `${CURSOR_WRAP_FN}(` +
    code.slice(cursorExpr.start, cursorExpr.end) +
    ')' +
    code.slice(cursorExpr.end);

  // Inject a synchronous module-local tree-gex binding so we don't depend on
  // the user's import alias.
  const preface =
    `import * as ${TG_ALIAS_VAR} from "tree-gex";\n` +
    `const ${CURSOR_WRAP_FN} = (__p) => ${TG_ALIAS_VAR}.group(__p, ${JSON.stringify(CURSOR_GROUP_NAME)});\n`;

  // The trailer runs a mirror accumWalkMatch so we can extract captures
  // independently of which walker the user picked (walkReplace drops
  // captures; this reruns against the same pattern to harvest them).
  //
  // If the wrap is INSIDE the walker's pattern arg, the original patternSrc
  // doesn't carry the wrap — we must reconstruct a wrapped patternSrc.
  // If the wrap is OUTSIDE (in a helper), the helper's binding already
  // carries the wrap by the time the trailer runs, so the patternSrc is
  // fine as-is (it references the wrapped helper through its identifier).
  const cursorInsidePattern =
    cursorExpr.start >= walker.patternArgStart && cursorExpr.end <= walker.patternArgEnd;
  let trailerPatternSrc = walker.patternArgSrc;
  if (cursorInsidePattern) {
    const relStart = cursorExpr.start - walker.patternArgStart;
    const relEnd = cursorExpr.end - walker.patternArgStart;
    trailerPatternSrc =
      walker.patternArgSrc.slice(0, relStart) +
      `${CURSOR_WRAP_FN}(` +
      walker.patternArgSrc.slice(relStart, relEnd) +
      ')' +
      walker.patternArgSrc.slice(relEnd);
  }

  const trailer =
    `\nexport const ${CURSOR_MATCHES_EXPORT} = ${TG_ALIAS_VAR}.accumWalkMatch(${walker.astArgSrc}, ${trailerPatternSrc});\n`;

  return {
    code: preface + firstWrap + trailer,
    wrapGlobal: CURSOR_WRAP_FN,
    matchesExport: CURSOR_MATCHES_EXPORT,
  };
}

type CapturedNode = { value: unknown };

type GroupsLike = Record<
  string,
  Array<{ value: unknown; groups?: GroupsLike; replacement?: { value: unknown } }>
>;

/**
 * Walk the matches array returned by accumWalkMatch and harvest every value
 * captured under the CURSOR_GROUP_NAME key (recursively through nested groups).
 */
export function extractCursorCaptures(matches: unknown): CapturedNode[] {
  const out: CapturedNode[] = [];
  const seen = new Set<unknown>();

  function walkGroups(groups: GroupsLike | undefined): void {
    if (!groups) return;
    for (const [key, entries] of Object.entries(groups)) {
      for (const entry of entries) {
        if (key === CURSOR_GROUP_NAME) {
          if (!seen.has(entry.value)) {
            seen.add(entry.value);
            out.push({ value: entry.value });
          }
        }
        walkGroups(entry.groups);
      }
    }
  }

  if (!Array.isArray(matches)) return out;
  for (const m of matches as Array<{ groups?: GroupsLike }>) {
    walkGroups(m.groups);
  }
  return out;
}
