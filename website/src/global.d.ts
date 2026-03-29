// Global type augmentations for astexplorer
// This file provides type declarations for browser globals accessed via
// `global.*` (webpack polyfills `global` to `window`) and for CSS module
// imports used by the webpack build.

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare var global: Window & typeof globalThis & {
  document: Document;
  location: Location;
  localStorage: Storage;
  onhashchange: ((this: WindowEventHandlers, ev: HashChangeEvent) => unknown) | null;
  onbeforeunload: ((this: WindowEventHandlers, ev: BeforeUnloadEvent) => unknown) | null;
  $node: unknown;
  acorn: unknown;
  tern: unknown;
  __filename: string;
};

interface Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: Function;
}

// Webpack AMD-style require used by the project
interface WebpackRequire {
  (deps: string[], callback: (...modules: any[]) => void): void;
  context(directory: string, useSubdirectories: boolean, regExp: RegExp): {
    keys(): string[];
    <T>(id: string): T;
  };
}
declare var require: WebpackRequire;

declare var process: { env: Record<string, string | undefined> };

// source-map library
declare module 'source-map/lib/source-map-consumer' {
  export class SourceMapConsumer {
    constructor(rawSourceMap: unknown);
    sources: string[];
    sourcesContent: string[];
    generatedPositionFor(pos: {line: number; column: number; source: string}): {line: number | null; column: number | null};
  }
}

// CodeMirror addon: Tern integration
declare namespace CodeMirror {
  class TernServer {
    constructor(options: unknown);
    complete(cm: CodeMirror.Editor): void;
    showType(cm: CodeMirror.Editor): void;
    showDocs(cm: CodeMirror.Editor): void;
    updateArgHints(cm: CodeMirror.Editor): void;
  }
}

// react-dom legacy render (React 16 API used by this project)
declare module 'react-dom' {
  export function render(element: React.ReactElement, container: Element | null): void;
}

// json-stringify-safe
declare module 'json-stringify-safe' {
  function stringify(obj: unknown, replacer?: unknown, spaces?: number): string;
  export default stringify;
}
