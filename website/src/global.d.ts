// Global type augmentations for astexplorer
export type GlobalMarker = 'global-type-augmentations';

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare global {
  var $node: unknown;
  var acorn: Record<string, unknown>;
  var tern: Record<string, unknown>;
  var __filename: string;

  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: ReduxDevToolsCompose;
  }
  // Matches Redux compose() — function composition with overloads
  interface ReduxDevToolsCompose {
    (): <R>(a: R) => R;
    <F extends (...args: unknown[]) => unknown>(f: F): F;
    (...funcs: Array<(...args: unknown[]) => unknown>): (...args: unknown[]) => unknown;
  }

  // Webpack AMD-style require used by the project.
  interface WebpackRequire {
    // Generic signature: TypeScript infers callback param types from the call site.
    <T extends unknown[]>(deps: string[], callback: (...modules: T) => void): void;
    context(directory: string, useSubdirectories: boolean, regExp: RegExp): {
      keys(): string[];
      <T>(id: string): T;
    };
  }
  var require: WebpackRequire;

  var process: { env: Record<string, string | undefined> };

  // CodeMirror addon: Tern integration
  namespace CodeMirror {
    class TernServer {
      constructor(options: unknown);
      complete(cm: CodeMirror.Editor): void;
      showType(cm: CodeMirror.Editor): void;
      showDocs(cm: CodeMirror.Editor): void;
      updateArgHints(cm: CodeMirror.Editor): void;
    }
  }
}

// No global type aliases — each parser types its own AST nodes and
// loaded modules concretely via import() or inline @typedef.

// ---------------------------------------------------------------------------
// Third-party module declarations
// ---------------------------------------------------------------------------

// source-map library
declare module 'source-map/lib/source-map-consumer' {
  export class SourceMapConsumer {
    constructor(rawSourceMap: unknown);
    sources: string[];
    sourcesContent: string[];
    generatedPositionFor(pos: {line: number; column: number; source: string}): {line: number | null; column: number | null};
  }
}

// react-dom legacy render (React 16 API used by this project)
declare module 'react-dom' {
  export function render(element: React.ReactElement, container: Element | null): void;
}

// Package.json imports – many parser files import a package.json and access
// `pkg.homepage`, but the resolved types often lack that field.
declare module '*/package.json' {
  const value: {
    name: string;
    version: string;
    homepage?: string;
    description?: string;
    repository?: { type?: string; url?: string; directory?: string; [k: string]: unknown };
    [key: string]: unknown;
  };
  export default value;
}

// json-stringify-safe
declare module 'json-stringify-safe' {
  function stringify(obj: unknown, replacer?: unknown, spaces?: number): string;
  export default stringify;
}

// Worker-loader import for hermes web worker
declare module 'worker-loader!./hermes-worker.ts' {
  class HermesWorker extends Worker {
    constructor();
  }
  export default HermesWorker;
}

// WASM binaries exported from astexplorer-parsers — declared in
// src/wasm-modules.d.ts (a script file, so they work as true ambient
// declarations rather than module augmentations).

// astexplorer-refmt esy.json
declare module 'astexplorer-refmt/esy.json' {
  const value: { name: string; version: string; [key: string]: unknown };
  export default value;
}

// luaparse
declare module 'luaparse' {
  function parse(code: string, options?: Record<string, unknown>): Record<string, unknown>;
  export = { parse };
}

// babel-eslint — parseNoPatch
declare module 'babel-eslint' {
  export function parseNoPatch(code: string, options?: Record<string, unknown>): Record<string, unknown>;
}

// halting-problem — loop detection
declare module 'halting-problem' {
  function halts(code: string): boolean;
  function loopProtect(code: string, callback: string): string;
  export default halts;
  export { loopProtect };
}

// babel-plugin-macros package metadata
declare module 'babel-plugin-macros/package' {
  const value: { name: string; version: string; [key: string]: unknown };
  export default value;
}

// lodash.isequal — see src/lodash-isequal.d.ts (must be a script file)

// prop-types — runtime prop validation library (not type-checked)
declare module 'prop-types' {
  interface Validator<T> {
    isRequired: Validator<T>;
  }
  interface PropTypesStatic {
    any: Validator<unknown>;
    array: Validator<unknown[]>;
    bool: Validator<boolean>;
    func: Validator<(...args: unknown[]) => unknown>;
    number: Validator<number>;
    object: Validator<Record<string, unknown>>;
    string: Validator<string>;
    node: Validator<unknown>;
    element: Validator<unknown>;
    symbol: Validator<symbol>;
    instanceOf(expectedClass: unknown): Validator<unknown>;
    oneOf(values: unknown[]): Validator<unknown>;
    oneOfType(validators: Validator<unknown>[]): Validator<unknown>;
    arrayOf(validator: Validator<unknown>): Validator<unknown>;
    objectOf(validator: Validator<unknown>): Validator<unknown>;
    shape(object: Record<string, Validator<unknown>>): Validator<unknown>;
    exact(object: Record<string, Validator<unknown>>): Validator<unknown>;
  }
  const PropTypes: PropTypesStatic;
  export default PropTypes;
}
