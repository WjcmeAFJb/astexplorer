import compileModule from '../../../utils/compileModule';
import pkg from 'remark/package.json';

const ID = 'remark';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: ID,

  loadTransformer(/** @type {(realTransformer: {remark: import('remark').remark, 'unist-util-is': (...args: unknown[]) => unknown, 'unist-util-visit': (...args: unknown[]) => unknown, 'unist-util-visit-parents': (...args: unknown[]) => unknown}) => void} */ callback) {
    require([
      'remark',
      'unist-util-is',
      'unist-util-visit',
      'unist-util-visit-parents',
    ], (/** @type {{remark: import('remark').remark}} */ { remark }, /** @type {{is: (...args: unknown[]) => unknown}} */ { is }, /** @type {{visit: (...args: unknown[]) => unknown}} */ { visit }, /** @type {{visitParents: (...args: unknown[]) => unknown}} */ { visitParents }) => {
      callback({
        // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- import type may not resolve
        remark,
        'unist-util-is': is,
        'unist-util-visit': visit,
        'unist-util-visit-parents': visitParents,
      });
    });
  },

  transform(/** @type {{remark: import('remark').remark, [key: string]: (...args: unknown[]) => unknown}} */ { remark, ...availableModules }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    function sandboxRequire(/** @type {string} */ name) {
      if (!Object.getOwnPropertyNames(availableModules).includes(name))
        throw new Error(`Cannot find module '${name}'`);
      return availableModules[name];
    }

    const transform = compileModule(transformCode, { require: sandboxRequire });
    // oxlint-disable-next-line typescript-eslint(no-unsafe-return), typescript-eslint(no-unsafe-member-access), typescript-eslint(no-unsafe-call) -- remark's FrozenProcessor type params mismatch between remark/unified .d.ts
    return remark().use(/** @type {Parameters<ReturnType<import('remark').remark>['use']>[0]} */ (/** @type {unknown} */ (transform))).processSync(code).value;
  },
};
