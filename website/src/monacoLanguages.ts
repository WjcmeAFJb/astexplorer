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
  typescript: 'typescript',
};

// Basic-language contribution loaders (syntax highlighting / tokenizers).
// Each contribution self-registers with Monaco's language registry.
// Using explicit () => import(...) with string literals so Vite can
// statically analyze and pre-bundle them for dev mode.
function loadBasicJS() {
  return import('monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution');
}
function loadBasicTS() {
  return import('monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution');
}
function loadBasicCSS() {
  return import('monaco-editor/esm/vs/basic-languages/css/css.contribution');
}
function loadBasicGo() {
  return import('monaco-editor/esm/vs/basic-languages/go/go.contribution');
}
function loadBasicHBS() {
  return import('monaco-editor/esm/vs/basic-languages/handlebars/handlebars.contribution');
}
function loadBasicHTML() {
  return import('monaco-editor/esm/vs/basic-languages/html/html.contribution');
}
function loadBasicLua() {
  return import('monaco-editor/esm/vs/basic-languages/lua/lua.contribution');
}
function loadBasicMD() {
  return import('monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution');
}
function loadBasicFS() {
  return import('monaco-editor/esm/vs/basic-languages/fsharp/fsharp.contribution');
}
function loadBasicPHP() {
  return import('monaco-editor/esm/vs/basic-languages/php/php.contribution');
}
function loadBasicProto() {
  return import('monaco-editor/esm/vs/basic-languages/protobuf/protobuf.contribution');
}
function loadBasicPug() {
  return import('monaco-editor/esm/vs/basic-languages/pug/pug.contribution');
}
function loadBasicPy() {
  return import('monaco-editor/esm/vs/basic-languages/python/python.contribution');
}
function loadBasicRust() {
  return import('monaco-editor/esm/vs/basic-languages/rust/rust.contribution');
}
function loadBasicSQL() {
  return import('monaco-editor/esm/vs/basic-languages/sql/sql.contribution');
}
function loadBasicYAML() {
  return import('monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution');
}
function loadBasicJava() {
  return import('monaco-editor/esm/vs/basic-languages/java/java.contribution');
}
function loadBasicScala() {
  return import('monaco-editor/esm/vs/basic-languages/scala/scala.contribution');
}
function loadBasicXML() {
  return import('monaco-editor/esm/vs/basic-languages/xml/xml.contribution');
}
function loadBasicGQL() {
  return import('monaco-editor/esm/vs/basic-languages/graphql/graphql.contribution');
}
function loadRichTS() {
  return import('monaco-editor/esm/vs/language/typescript/monaco.contribution');
}
function loadRichJSON() {
  return import('monaco-editor/esm/vs/language/json/monaco.contribution');
}
function loadRichCSS() {
  return import('monaco-editor/esm/vs/language/css/monaco.contribution');
}
function loadRichHTML() {
  return import('monaco-editor/esm/vs/language/html/monaco.contribution');
}

const basicLanguageLoaders: Record<string, () => Promise<unknown>> = {
  javascript: loadBasicJS,
  typescript: loadBasicTS,
  css: loadBasicCSS,
  go: loadBasicGo,
  handlebars: loadBasicHBS,
  html: loadBasicHTML,
  lua: loadBasicLua,
  markdown: loadBasicMD,
  fsharp: loadBasicFS,
  php: loadBasicPHP,
  protobuf: loadBasicProto,
  pug: loadBasicPug,
  python: loadBasicPy,
  rust: loadBasicRust,
  sql: loadBasicSQL,
  yaml: loadBasicYAML,
  java: loadBasicJava,
  scala: loadBasicScala,
  xml: loadBasicXML,
  graphql: loadBasicGQL,
};

// Rich language service loaders (IntelliSense, validation, etc.)
// Only enabled for 'javascript' — the TS contribution registers the
// JS/TS language service worker which provides IntelliSense for JS models.
// The tree-gex editor uses 'javascript' mode (not 'typescript') to leverage
// this worker, since the TS worker can't sync models in Vite dev mode.
const richLanguageLoaders: Record<string, () => Promise<unknown>> = {
  javascript: loadRichTS,
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
