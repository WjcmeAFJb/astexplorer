/**
 * @param {string} code
 * @param {Record<string, unknown>} [globals]
 * @returns {Record<string, any>}
 */
export default function compileModule(code, globals = {}) {
  let exports = /** @type {Record<string, any>} */ ({});
  let module = { exports };
  let globalNames = Object.keys(globals);
  let keys = ['module', 'exports', ...globalNames];
  let values = [module, exports, ...globalNames.map(key => globals[key])];
  new Function(keys.join(), code).apply(exports, values);
  return module.exports;
}
