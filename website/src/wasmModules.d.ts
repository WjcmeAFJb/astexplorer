// Ambient module declarations for WASM binaries from astexplorer-parsers.
// These must live in a script file (no top-level import/export) so that
// TypeScript treats them as true ambient declarations rather than module
// augmentations.

declare module 'astexplorer-parsers/swc.wasm' {
  const url: string;
  export default url;
}
declare module 'astexplorer-parsers/syn.wasm' {
  const url: string;
  export default url;
}
declare module 'astexplorer-parsers/go.wasm' {
  const url: string;
  export default url;
}
declare module 'astexplorer-parsers/monkey.wasm' {
  const url: string;
  export default url;
}
