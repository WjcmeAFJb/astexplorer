// Monaco Editor worker setup — workers are loaded lazily via dynamic import().
// This avoids fetching all ~8.8MB of worker scripts on page load.

declare const self: Window & { MonacoEnvironment?: unknown };

self.MonacoEnvironment = {
  async getWorker(_workerId: string, label: string) {
    if (label === 'json') {
      const { default: W } = await import('monaco-editor/esm/vs/language/json/json.worker?worker');
      return new W();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      const { default: W } = await import('monaco-editor/esm/vs/language/css/css.worker?worker');
      return new W();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      const { default: W } = await import('monaco-editor/esm/vs/language/html/html.worker?worker');
      return new W();
    }
    if (label === 'typescript' || label === 'javascript') {
      const { default: W } =
        await import('monaco-editor/esm/vs/language/typescript/ts.worker?worker');
      return new W();
    }
    const { default: W } = await import('monaco-editor/esm/vs/editor/editor.worker?worker');
    return new W();
  },
};
