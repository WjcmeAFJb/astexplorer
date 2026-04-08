// Maps CodeMirror mode names to Monaco language identifiers and lazily
// registers language contributions. With the edcore.main entry point,
// Monaco ships no language registrations — we load them on demand.

const cmModeToMonaco: Record<string, string> = {
  javascript: 'javascript',
  css: 'css',
  'text/css': 'css',
  go: 'go',
  handlebars: 'handlebars',
  htmlmixed: 'html',
  lua: 'lua',
  markdown: 'markdown',
  mllike: 'fsharp',
  'text/x-ocaml': 'fsharp',
  php: 'php',
  protobuf: 'protobuf',
  pug: 'pug',
  python: 'python',
  rust: 'rust',
  sql: 'sql',
  vue: 'html',
  webidl: 'plaintext',
  yaml: 'yaml',
  clike: 'java',
  'text/x-java': 'java',
  'text/x-scala': 'scala',
  xml: 'xml',
  graphql: 'graphql',
};

// Basic-language contribution loaders (syntax highlighting / tokenizers).
// Each contribution self-registers with Monaco's language registry.
const basicLanguageLoaders: Record<string, () => Promise<unknown>> = {
  javascript: () =>
    import('monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution.js'),
  css: () => import('monaco-editor/esm/vs/basic-languages/css/css.contribution.js'),
  go: () => import('monaco-editor/esm/vs/basic-languages/go/go.contribution.js'),
  handlebars: () =>
    import('monaco-editor/esm/vs/basic-languages/handlebars/handlebars.contribution.js'),
  html: () => import('monaco-editor/esm/vs/basic-languages/html/html.contribution.js'),
  lua: () => import('monaco-editor/esm/vs/basic-languages/lua/lua.contribution.js'),
  markdown: () => import('monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js'),
  fsharp: () => import('monaco-editor/esm/vs/basic-languages/fsharp/fsharp.contribution.js'),
  php: () => import('monaco-editor/esm/vs/basic-languages/php/php.contribution.js'),
  protobuf: () => import('monaco-editor/esm/vs/basic-languages/protobuf/protobuf.contribution.js'),
  pug: () => import('monaco-editor/esm/vs/basic-languages/pug/pug.contribution.js'),
  python: () => import('monaco-editor/esm/vs/basic-languages/python/python.contribution.js'),
  rust: () => import('monaco-editor/esm/vs/basic-languages/rust/rust.contribution.js'),
  sql: () => import('monaco-editor/esm/vs/basic-languages/sql/sql.contribution.js'),
  yaml: () => import('monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'),
  java: () => import('monaco-editor/esm/vs/basic-languages/java/java.contribution.js'),
  scala: () => import('monaco-editor/esm/vs/basic-languages/scala/scala.contribution.js'),
  xml: () => import('monaco-editor/esm/vs/basic-languages/xml/xml.contribution.js'),
  graphql: () => import('monaco-editor/esm/vs/basic-languages/graphql/graphql.contribution.js'),
};

// Rich language service loaders (IntelliSense, validation, etc.)
// These are heavier and load workers, so only load when the language is used.
const richLanguageLoaders: Record<string, () => Promise<unknown>> = {
  javascript: () => import('monaco-editor/esm/vs/language/typescript/monaco.contribution.js'),
  typescript: () => import('monaco-editor/esm/vs/language/typescript/monaco.contribution.js'),
  json: () => import('monaco-editor/esm/vs/language/json/monaco.contribution.js'),
  css: () => import('monaco-editor/esm/vs/language/css/monaco.contribution.js'),
  html: () => import('monaco-editor/esm/vs/language/html/monaco.contribution.js'),
};

const registrationPromises = new Map<string, Promise<void>>();

/**
 * Ensure a Monaco language is registered. Returns a Promise that resolves
 * once the language contribution module has been loaded and registerLanguage()
 * has been called. The editor must wait for this before the tokenizer works.
 */
export function ensureLanguageRegistered(monacoLangId: string): Promise<void> {
  if (monacoLangId === 'plaintext') return Promise.resolve();

  const existing = registrationPromises.get(monacoLangId);
  if (existing) return existing;

  const promises: Promise<unknown>[] = [];

  const basicLoader = basicLanguageLoaders[monacoLangId];
  if (basicLoader) promises.push(basicLoader());

  const richLoader = richLanguageLoaders[monacoLangId];
  if (richLoader) promises.push(richLoader());

  if (promises.length === 0) {
    const resolved = Promise.resolve();
    registrationPromises.set(monacoLangId, resolved);
    return resolved;
  }

  const promise = Promise.all(promises).then(() => {});
  registrationPromises.set(monacoLangId, promise);
  return promise;
}

export function getMonacoLanguage(mode: string | { name: string } | undefined): string {
  if (mode === undefined) return 'plaintext';
  const name = typeof mode === 'string' ? mode : mode.name;
  return cmModeToMonaco[name] ?? 'plaintext';
}
