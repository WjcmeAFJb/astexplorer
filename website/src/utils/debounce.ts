// oxlint-disable unicorn/no-null, typescript-eslint/strict-boolean-expressions -- legacy code uses null for timer state; strict boolean checks not feasible without full type migration
export default function debounce(f: (...args: unknown[]) => void, timeout?: number): (...args: unknown[]) => void {
    let timer: ReturnType<typeof setTimeout> | null;
    let lastArgs: unknown[];
    let lastThis: unknown;

  return function(...args) {
    // oxlint-disable-next-line typescript-eslint/no-this-alias, unicorn/no-this-assignment -- debounce must capture `this` for deferred apply()
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
