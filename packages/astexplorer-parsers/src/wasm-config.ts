const wasmUrls: Record<string, string> = {};

export function configureWasm(urls: Record<string, string>): void {
  Object.assign(wasmUrls, urls);
}

export function getWasmUrl(parserId: string): string {
  const url = wasmUrls[parserId];
  if (!url) {
    throw new Error(
      `WASM URL not configured for parser "${parserId}". Call configureWasm() first.`,
    );
  }
  return url;
}
