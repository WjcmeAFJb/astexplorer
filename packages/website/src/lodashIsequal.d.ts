// Ambient module declaration for lodash.isequal.
// This must live in a script file (no top-level import/export) so that
// TypeScript treats it as a true ambient declaration rather than a module
// augmentation.  global.d.ts is a module file (it has a top-level export),
// so declare-module inside it only acts as an augmentation and is ignored
// when resolving the real JS file under moduleResolution: "bundler".

declare module 'lodash.isequal' {
  function isEqual(a: unknown, b: unknown): boolean;
  export default isEqual;
}
