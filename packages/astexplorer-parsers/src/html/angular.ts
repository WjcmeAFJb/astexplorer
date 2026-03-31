import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from '@angular/compiler/package.json';

type AngularNode = {startSourceSpan?: {start: {offset: number}, end: {offset: number}}, endSourceSpan?: {start: {offset: number}, end: {offset: number}}, sourceSpan?: {start: {offset: number}, end: {offset: number}}, span?: {start: number, end: number}, name?: string, constructor?: {name: string}, [key: string]: unknown};
type AngularCompiler = typeof import('@angular/compiler');

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

  loadParser(callback: (realParser: AngularCompiler) => void) {
    require(['@angular/compiler'], callback);
  },

  parse(ng: AngularCompiler, code: string, options: import('@angular/compiler').ParseTemplateOptions) {
    const ast = ng.parseTemplate(code, 'astexplorer.html', options);
    fixSpan(ast, code);
    return ast;
  },

  nodeToRange(node: AngularNode) {
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

  getNodeName(node: AngularNode) {
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

function getNodeCtor(node: AngularNode) {
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
function fixSpan(ast: import('@angular/compiler').ParsedTemplate, code: string) {
  const fixed = new Set();
  const KEEP_VISIT = 1;
  function visitTarget(value: unknown, isTarget: (v: unknown) => boolean, fn: (node: Record<string, unknown>, parent: unknown) => number | void, parent?: unknown) {
    if (value !== null && typeof value === 'object') {
      const obj = (value as Record<string, unknown>);
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

  function getBaseStart(parent: AngularNode) {
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
    (value: unknown) => getNodeCtor((value as AngularNode)) === 'ASTWithSource',
    (node: Record<string, unknown>, parent: unknown) => {
      const baseStart = getBaseStart((parent as AngularNode));
      visitTarget(
        node,
        (value: unknown) => (value as Record<string, unknown>).span != null,
        (node: Record<string, unknown>) => {
          if (!fixed.has(node)) {
            const span = (node.span as {start: number, end: number});
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
