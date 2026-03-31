import compileModule from '../../../utils/compileModule';
import pkg from 'regexp-tree/package.json';

const ID = 'regexp-tree';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: ID,

  loadTransformer(callback: (realTransformer: {transpile: (code: string) => string, regexpTree: typeof import('regexp-tree')}) => void) {
    require([
      '../../../transpilers/babel',
      'regexp-tree',
    ], (transpile: {default: (code: string) => string}, regexpTree: typeof import('regexp-tree')) => callback({ transpile: transpile.default, regexpTree }));
  },

  transform({ transpile, regexpTree }: {transpile: (code: string) => string, regexpTree: typeof import('regexp-tree')}, transformCode: string, code: string) {
    transformCode = transpile(transformCode);
    let handler = compileModule( // eslint-disable-line no-shadow
      transformCode,
    );

    return regexpTree.transform(code, (handler as import('regexp-tree').TransformHandlers)).toString();
  },
};
