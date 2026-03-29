import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from '@angular/compiler/package.json';

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

  loadParser(/** @type {(realParser: Record<string, Function>) => void} */ callback) {
    require(['@angular/compiler'], callback);
  },

  parse(/** @type {Record<string, Function>} */ ng, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    const ast = ng.parseTemplate(code, 'astexplorer.html', options);
    fixSpan(ast, code);
    return ast;
  },

  nodeToRange(/** @type {Record<string, unknown>} */ node) {
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

  getNodeName(/** @type {Record<string, unknown>} */ node) {
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

function getNodeCtor(/** @type {Record<string, unknown>} */ node) {
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
function fixSpan(/** @type {Record<string, unknown>} */ ast, /** @type {string} */ code) {
  const fixed = new Set();
  const KEEP_VISIT = 1;
  function visitTarget(/** @type {unknown} */ value, /** @type {Record<string, unknown>} */ isTarget, /** @type {Record<string, unknown>} */ fn, /** @type {Record<string, unknown>} */ parent) {
    if (value !== null && typeof value === 'object') {
      if (isTarget(value)) {
        if (fn(value, parent) !== KEEP_VISIT) {
          return;
        }
      }
      if (Array.isArray(value)) {
        value.forEach(subValue => visitTarget(subValue, isTarget, fn, value));
      } else {
        for (const key in value) {
          visitTarget(value[key], isTarget, fn, value);
        }
      }
    }
  }

  function getBaseStart(/** @type {Record<string, unknown>} */ parent) {
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
    (/** @type {unknown} */ value) => getNodeCtor(value) === 'ASTWithSource',
    (/** @type {Record<string, unknown>} */ node, /** @type {Record<string, unknown>} */ parent) => {
      const baseStart = getBaseStart(parent);
      visitTarget(
        node,
        (/** @type {unknown} */ value) => value.span,
        (/** @type {Record<string, unknown>} */ node) => {
          if (!fixed.has(node)) {
            node.span.start += baseStart;
            node.span.end += baseStart;
            fixed.add(node);
          }

          return KEEP_VISIT;
        },
      );
    },
  );
}
