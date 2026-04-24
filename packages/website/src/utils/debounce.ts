export default function debounce(
  f: (...args: unknown[]) => void,
  timeout?: number,
): (...args: unknown[]) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: { context: unknown; args: unknown[] } | undefined;

  return function (this: unknown, ...args: unknown[]) {
    pending = { context: this, args };
    if (timer !== undefined) {
      return;
    }
    timer = setTimeout(() => {
      timer = undefined;
      if (pending !== undefined) {
        f.apply(pending.context, pending.args);
      }
    }, timeout);
  };
}
