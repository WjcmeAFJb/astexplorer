/**
 * @typedef {((...args: unknown[]) => unknown) & {[key: string]: unknown, __esModule?: boolean, default?: ((...args: unknown[]) => unknown)}} CompiledModule
 */

/**
 * @param {string} code
 * @param {Record<string, unknown>} [globals]
 * @returns {CompiledModule}
 */
export default function compileModule(code, globals = {}) {
  let exports = /** @type {Record<string, unknown>} */ ({});
  let module = { exports };
  let globalNames = Object.keys(globals);
  let keys = ['module', 'exports', ...globalNames];
  let values = [module, exports, ...globalNames.map(key => globals[key])];
  // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- new Function() returns any; unavoidable
  new Function(keys.join(), code).apply(exports, values);
  return /** @type {CompiledModule} */ (/** @type {unknown} */ (module.exports));
}
