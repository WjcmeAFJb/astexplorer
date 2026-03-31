type CompiledModule = ((...args: unknown[]) => unknown) & {[key: string]: unknown, __esModule?: boolean, default?: ((...args: unknown[]) => unknown)};

export default function compileModule(code: string, globals: Record<string, unknown> = {}): CompiledModule {
  let exports = ({} as Record<string, unknown>);
  let module = { exports };
  let globalNames = Object.keys(globals);
  let keys = ['module', 'exports', ...globalNames];
  let values = [module, exports, ...globalNames.map(key => globals[key])];
  // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- new Function() returns any; unavoidable
  new Function(keys.join(), code).apply(exports, values);
  return ((module.exports as unknown) as CompiledModule);
}
