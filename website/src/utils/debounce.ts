export default function debounce(f: (...args: unknown[]) => void, timeout?: number): (...args: unknown[]) => void {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastArgs: unknown[];
    let lastThis: unknown;

  return function(...args) {
    // oxlint-disable-next-line typescript-eslint/no-this-alias, unicorn/no-this-assignment -- debounce must capture `this` for deferred apply()
    lastThis = this;
    lastArgs = args;
    if (timer !== undefined) {
      return;
    }
    timer = setTimeout(() => {
      timer = undefined;
      f.apply(lastThis, lastArgs);
    }, timeout);
  };
}
