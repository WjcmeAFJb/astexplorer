import defaultParserInterface from '../js/utils/defaultESTreeParserInterface';
import pkg from '@angular-eslint/template-parser/package.json';

const ID = '@angular-eslint/template-parser';

function wrapParesr(/** @type {(realParser: DynModule) => void} */ callback, /** @type {DynModule} */ { parseForESLint }) {
  const parse = (/** @type {string} */ code, /** @type {Record<string, unknown>} */ options) => {
    const {
      ast,
      visitorKeys,
      services: { convertNodeSourceSpanToLoc },
    } = parseForESLint(code, options);

    // Traverse AST in order to add `loc` and `range` for each child
    const addLocation = (/** @type {ASTNode} */ node) => {
      if (!node.startSourceSpan || !node.endSourceSpan) {
        if (!node.sourceSpan) return node;
        const range = node.range || [
          node.sourceSpan.start.offset,
          node.sourceSpan.end.offset,
        ];
        const loc = node.loc || convertNodeSourceSpanToLoc(node.sourceSpan);
        return {
          ...node,
          range,
          loc,
        };
      } else {
        const range = node.range || [
          node.startSourceSpan.start.offset,
          node.endSourceSpan.end.offset,
        ];
        const loc = node.loc || { 
          start: convertNodeSourceSpanToLoc(node.startSourceSpan).start,
          end: convertNodeSourceSpanToLoc(node.endSourceSpan).end,
        };
        return {
          ...node,
          range,
          loc,
        };
      }
    };

    const visit = (/** @type {ASTNode} */ node) => {
      const keys = visitorKeys[node.type] || [];
      const newNode = keys.reduce((/** @type {ASTNode} */ acc, /** @type {string} */ key) => {
        const child = node[key];
        if (Array.isArray(child)) {
          const children = child;
          return { ...acc, [key]: children.map(visit) };
        } else if (child != null) {
          return { ...acc, [key]: visit(child) };
        } else {
          return acc;
        }
      }, node);
      return addLocation(newNode);
    };
    return visit(ast);
  };

  return callback({ parse });
}

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/angular-eslint/angular-eslint',
  locationProps: new Set(['loc', 'start', 'end', 'range', 'startSourceSpan', 'endSourceSpan', 'sourceSpan', 'handlerSpan', 'location']),

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['@angular-eslint/template-parser'], wrapParesr.bind(null, callback));
  },

  parse(/** @type {DynModule} */ parser, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    return parser.parse(code, options);
  },
};
