import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from '@angular/compiler/package.json';

/** @typedef {{startSourceSpan?: {start: {offset: number}, end: {offset: number}}, endSourceSpan?: {start: {offset: number}, end: {offset: number}}, sourceSpan?: {start: {offset: number}, end: {offset: number}}, span?: {start: number, end: number}, name?: string, constructor?: {name: string}, [key: string]: unknown}} AngularNode */
/** @typedef {typeof import('@angular/compiler')} AngularCompiler */

const ID = 'angular';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set([
    'span',
    'sourceSpan',
    'startSourceSpan',
    'endSourceSpan',
  ]),
  typeProps: new Set(['name']),

  loadParser(/** @type {(realParser: AngularCompiler) => void} */ callback) {
    require(['@angular/compiler'], callback);
  },

  parse(/** @type {AngularCompiler} */ ng, /** @type {string} */ code, /** @type {import('@angular/compiler').ParseTemplateOptions} */ options) {
    const ast = ng.parseTemplate(code, 'astexplorer.html', options);
    fixSpan(ast, code);
    return ast;
  },

  nodeToRange(/** @type {AngularNode} */ node) {
    if (node.startSourceSpan) {
      if (node.endSourceSpan) {
        return [
          node.startSourceSpan.start.offset,
          node.endSourceSpan.end.offset,
        ];
      }
      return [
        node.startSourceSpan.start.offset,
        node.startSourceSpan.end.offset,
      ];
    }
    if (node.sourceSpan) {
      return [node.sourceSpan.start.offset, node.sourceSpan.end.offset];
    }
    if (node.span) {
      return [node.span.start, node.span.end];
    }
  },

  getNodeName(/** @type {AngularNode} */ node) {
    let name = getNodeCtor(node);
    if (node.name) {
      name += `(${node.name})`;
    }
    return name;
  },

  getDefaultOptions() {
    return {
      preserveWhitespaces: false,
    };
  },
};

function getNodeCtor(/** @type {AngularNode} */ node) {
  return node.constructor && node.constructor.name;
}

/**
 * Locations from sub AST are counted from that part of string,
 * we need to fix them to make autofocus work.
 *
 * Before:
 *
 *     <tag [attr]="expression">
 *                  ^^^^^^^^^^ sub AST { start: 0, end: 10 }
 *
 * After:
 *
 *     <tag [attr]="expression">
 *                  ^^^^^^^^^^ sub AST { start: 13, end: 23 }
 */
function fixSpan(/** @type {import('@angular/compiler').ParsedTemplate} */ ast, /** @type {string} */ code) {
  const fixed = new Set();
  const KEEP_VISIT = 1;
  function visitTarget(/** @type {unknown} */ value, /** @type {(v: unknown) => boolean} */ isTarget, /** @type {(node: Record<string, unknown>, parent: unknown) => number | void} */ fn, /** @type {unknown} */ parent) {
    if (value !== null && typeof value === 'object') {
      const obj = /** @type {Record<string, unknown>} */ (value);
      if (isTarget(obj)) {
        if (fn(obj, parent) !== KEEP_VISIT) {
          return;
        }
      }
      if (Array.isArray(value)) {
        value.forEach(subValue => visitTarget(subValue, isTarget, fn, value));
      } else {
        for (const key in obj) {
          visitTarget(obj[key], isTarget, fn, obj);
        }
      }
    }
  }

  function getBaseStart(/** @type {AngularNode} */ parent) {
    const nodeName = getNodeCtor(parent);
    switch (nodeName) {
      case 'BoundAttribute':
      case 'BoundEvent': {
        let {offset} = parent.sourceSpan.start;
        const isStructuralBinding = !/[[(]/.test(code[offset]);
        if (isStructuralBinding) {
          return offset;
        }

        const assignment = /[=:]/;
        while (code[offset] && !assignment.test(code[offset++]));

        if (!code[offset]) {
          console.warn('Unable to fix span values', parent);
        }

        if (code[offset] === "'" || code[offset] === '"') offset++;

        return offset;
      }
      case 'BoundText':
        return parent.sourceSpan.start.offset;
      default:
        throw new Error(`Unexpected node ${nodeName}`);
    }
  }

  visitTarget(
    ast,
    (/** @type {unknown} */ value) => getNodeCtor(/** @type {AngularNode} */ (value)) === 'ASTWithSource',
    (/** @type {Record<string, unknown>} */ node, /** @type {unknown} */ parent) => {
      const baseStart = getBaseStart(/** @type {AngularNode} */ (parent));
      visitTarget(
        node,
        (/** @type {unknown} */ value) => /** @type {Record<string, unknown>} */ (value).span != null,
        (/** @type {Record<string, unknown>} */ node) => {
          if (!fixed.has(node)) {
            const span = /** @type {{start: number, end: number}} */ (node.span);
            span.start += baseStart;
            span.end += baseStart;
            fixed.add(node);
          }

          return KEEP_VISIT;
        },
      );
    },
  );
}
