export default function debounce(f: (...args: unknown[]) => void, timeout?: number): (...args: unknown[]) => void {
    let timer: ReturnType<typeof setTimeout> | null;
    let lastArgs: unknown[];
    let lastThis: unknown;

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
