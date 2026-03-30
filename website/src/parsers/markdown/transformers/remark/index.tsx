import compileModule from '../../../utils/compileModule';
import pkg from 'remark/package.json';

const ID = 'remark';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: ID,

  loadTransformer(callback: (realTransformer: {remark: typeof import('remark').remark, 'unist-util-is': (...args: unknown[]) => unknown, 'unist-util-visit': (...args: unknown[]) => unknown, 'unist-util-visit-parents': (...args: unknown[]) => unknown}) => void) {
    require([
      'remark',
      'unist-util-is',
      'unist-util-visit',
      'unist-util-visit-parents',
    ], ({ remark }: {remark: typeof import('remark').remark}, { is }: {is: (...args: unknown[]) => unknown}, { visit }: {visit: (...args: unknown[]) => unknown}, { visitParents }: {visitParents: (...args: unknown[]) => unknown}) => {
      callback({
        // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- import type may not resolve
        remark,
        'unist-util-is': is,
        'unist-util-visit': visit,
        'unist-util-visit-parents': visitParents,
      });
    });
  },

  transform({ remark, ...availableModules }: {remark: typeof import('remark').remark, [key: string]: (...args: unknown[]) => unknown}, transformCode: string, code: string) {
    function sandboxRequire(name: string) {
      if (!Object.getOwnPropertyNames(availableModules).includes(name))
        throw new Error(`Cannot find module '${name}'`);
      return availableModules[name];
    }

    const transform = compileModule(transformCode, { require: sandboxRequire });
    // oxlint-disable-next-line typescript-eslint(no-unsafe-return), typescript-eslint(no-unsafe-member-access), typescript-eslint(no-unsafe-call) -- remark's FrozenProcessor type params mismatch between remark/unified .d.ts
    return remark().use(((transform as unknown) as Parameters<ReturnType<typeof import('remark').remark>['use']>[0])).processSync(code).value;
  },
};
