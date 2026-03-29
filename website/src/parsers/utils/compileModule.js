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
  new Function(keys.join(), code).apply(exports, values);
  return /** @type {CompiledModule} */ (/** @type {unknown} */ (module.exports));
}
