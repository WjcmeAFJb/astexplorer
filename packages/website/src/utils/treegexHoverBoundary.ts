/**
 * Compute the boundary [start, end] of the tree-gex sub-expression under a
 * cursor offset in the transform editor. Mirrors the selection logic used by
 * the parsers' cursor-capture pipeline so that the visual hover-boundary and
 * the actual captured sub-expression stay consistent.
 *
 * Scope is the whole user module: patterns can be split across helper
 * variables and even live inside function bodies, so any wrappable
 * expression anywhere in the code is a valid hover target.
 */

import * as acornImport from 'acorn';

// Acorn's ESM/CJS dual packaging sometimes exposes the namespace on `.default`
// (depending on the bundler). Fall back to the namespace if no default is set.
// oxlint-disable-next-line typescript-eslint(no-explicit-any)
const acorn: typeof acornImport = (acornImport as any).default ?? acornImport;

type AcornNode = {
  type: string;
  start: number;
  end: number;
  [key: string]: unknown;
};

function isWrappable(node: AcornNode): boolean {
  switch (node.type) {
    case 'ObjectExpression':
    case 'ArrayExpression':
    case 'CallExpression':
    case 'Identifier':
      return true;
    default:
      return false;
  }
}

/**
 * Parse the user's transform code and return the [start, end] range of the
 * smallest "wrappable" expression that contains `offset`. Returns `null` if
 * parsing fails or no suitable sub-expression is under the offset.
 */
export function findHoverBoundary(code: string, offset: number): [number, number] | null {
  if (typeof offset !== 'number' || offset < 0) return null;

  let ast: AcornNode;
  try {
    ast = acorn.parse(code, {
      sourceType: 'module',
      ecmaVersion: 'latest',
      allowReserved: true,
      allowReturnOutsideFunction: true,
      allowHashBang: true,
    }) as unknown as AcornNode;
  } catch {
    return null;
  }

  let best: AcornNode | null = null;

  function recurse(node: AcornNode, parent: AcornNode | null, parentKey: string | null): void {
    if (!node || typeof node.type !== 'string') return;
    if (typeof node.start !== 'number' || typeof node.end !== 'number') return;
    if (offset < node.start || offset > node.end) return;

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

  if (!best) return null;
  return [(best as AcornNode).start, (best as AcornNode).end];
}
