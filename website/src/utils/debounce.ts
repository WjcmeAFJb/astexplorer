/**
 * @param {(...args: unknown[]) => void} f
 * @param {number} [timeout=100]
 * @returns {(...args: unknown[]) => void}
 */
export default function debounce(f, timeout=100) {
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer;
  /** @type {unknown[]} */
  let lastArgs;
  /** @type {unknown} */
  let lastThis;

  return function(...args) {
    lastThis = this;
    lastArgs = args;
    if (timer) {
      return;
    }
    timer = setTimeout(() => {
      timer = null;
      f.apply(lastThis, lastArgs);
    }, timeout);
  };
}
