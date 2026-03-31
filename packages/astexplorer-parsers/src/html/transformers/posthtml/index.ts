import compileModule from '../../../utils/compileModule';
import pkg from 'posthtml/package.json';

const ID = 'posthtml';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/posthtml/posthtml',

  defaultParserID: 'posthtml-parser',

  loadTransformer(callback: (realTransformer: {transpile: (code: string) => string, posthtml: typeof import('posthtml')}) => void) {
    require(['../../../transpilers/babel', 'posthtml'], (transpile: {default: (code: string) => string}, posthtml: typeof import('posthtml')) =>
      callback({ transpile: transpile.default, posthtml }));
  },

  transform({ transpile, posthtml }: {transpile: (code: string) => string, posthtml: typeof import('posthtml')}, transformCode: string, code: string) {
    // transpile with babel for es6+ support
    transformCode = transpile(transformCode);
    // compile to turn from string into a module
    let transform = compileModule(
      // eslint-disable-line no-shadow
      transformCode,
    );
    return (((posthtml()
      .use(transform.default || transform)
      .process(code, { sync: true }) as unknown) as import('posthtml').Result<unknown>)).html;
  },
};
