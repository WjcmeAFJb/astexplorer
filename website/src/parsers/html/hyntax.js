import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'hyntax/package.json';
import {
  NODE_DOCTYPE,
  NODE_TAG,
  NODE_TEXT,
  NODE_COMMENT,
  NODE_SCRIPT,
  NODE_STYLE,
} from 'hyntax/lib-es5/constants/ast-nodes';

const ID = 'hyntax';

function getTagEndPosition (/** @type {Record<string, unknown>} */ node) {
  if (node.content.close) {
    return node.content.close.endPosition + 1
  }

  if (node.content.openEnd) {
    return node.content.openEnd.endPosition + 1
  }

  return node.content.openStart.endPosition + 1
}

function getDoctypeRange (/** @type {Record<string, unknown>} */ node) {
  return [
    node.content.start.startPosition,
    node.content.end.endPosition + 1,
  ];
}

function getTagRange (/** @type {Record<string, unknown>} */ node) {
  const endPosition = getTagEndPosition(node);

  return [
    node.content.openStart.startPosition,
    endPosition,
  ];
}

function getTextRange (/** @type {Record<string, unknown>} */ node) {
  return [
    node.content.value.startPosition,
    node.content.value.endPosition + 1,
  ];
}

function getCommentRange (/** @type {Record<string, unknown>} */ node) {
  return [
    node.content.start.startPosition,
    node.content.end.endPosition + 1,
  ];
}

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/nik-garmash/hyntax',
  locationProps: new Set(['startPosition', 'endPosition']),

  loadParser (/** @type {(realParser: Record<string, Function>) => void} */ callback) {
    require([
      'hyntax/lib-es5/tokenize',
      'hyntax/lib-es5/construct-tree',
    ], (tokenize, constructTree) => {
      callback({ tokenize, constructTree });
    });
  },

  parse (/** @type {Record<string, Function>} */ { tokenize, constructTree }, /** @type {string} */ code) {
    const { tokens } = tokenize(code);
    const { ast } = constructTree(tokens);

    return ast;
  },

  nodeToRange (/** @type {Record<string, unknown>} */ node) {
    if (node.nodeType !== undefined) {
      if (node.nodeType === NODE_DOCTYPE) {
        return getDoctypeRange(node);
      }

      if (
        node.nodeType === NODE_TAG ||
        node.nodeType === NODE_SCRIPT ||
        node.nodeType === NODE_STYLE
      ) {
        return getTagRange(node);
      }

      if (node.nodeType === NODE_TEXT) {
        return getTextRange(node);
      }

      if (node.nodeType === NODE_COMMENT) {
        return getCommentRange(node);
      }
    }
  },

  opensByDefault (/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
    return [
      'content',
      'children',
      'value',
    ].includes(key)
  },

  getNodeName (/** @type {Record<string, unknown>} */ node) {
    if (node.nodeType === undefined) {
      return;
    }

    let nodeName = node.nodeType;

    if (node.content.name !== undefined) {
      nodeName += `(${node.content.name})`;
    }

    return nodeName;
  },

  _ignoredProperties: new Set(['parentRef']),
};
