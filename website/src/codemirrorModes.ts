// Lazy CodeMirror mode loaders -- keyed by the mode name used in setOption('mode', ...)
// These import modes from the website's CodeMirror instance, not the parsers bundle's.
const modeLoaders: Record<string, () => Promise<unknown>> = {
  css: () => import('codemirror/mode/css/css'),
  'text/css': () => import('codemirror/mode/css/css'),
  go: () => import('codemirror/mode/go/go'),
  handlebars: () => import('codemirror/mode/handlebars/handlebars'),
  htmlmixed: () => import('codemirror/mode/htmlmixed/htmlmixed'),
  javascript: () => import('codemirror/mode/javascript/javascript'),
  lua: () => import('codemirror/mode/lua/lua'),
  markdown: () => import('codemirror/mode/markdown/markdown'),
  mllike: () => import('codemirror/mode/mllike/mllike'),
  'text/x-ocaml': () => import('codemirror/mode/mllike/mllike'),
  php: () => import('codemirror/mode/php/php'),
  protobuf: () => import('codemirror/mode/protobuf/protobuf'),
  pug: () => import('codemirror/mode/pug/pug'),
  python: () => import('codemirror/mode/python/python'),
  rust: () => import('codemirror/mode/rust/rust'),
  sql: () => import('codemirror/mode/sql/sql'),
  vue: () => import('codemirror/mode/vue/vue'),
  webidl: () => import('codemirror/mode/webidl/webidl'),
  yaml: () => import('codemirror/mode/yaml/yaml'),
  clike: () => import('codemirror/mode/clike/clike'),
  'text/x-java': () => import('codemirror/mode/clike/clike'),
  'text/x-scala': () => import('codemirror/mode/clike/clike'),
  xml: () => import('codemirror/mode/xml/xml'),
};

const loaded = new Set<string>();

export function ensureCMMode(mode: string | {name: string} | undefined): Promise<void> {
  if (mode === undefined) return Promise.resolve();
  const name = typeof mode === 'string' ? mode : mode.name;
  if (loaded.has(name)) return Promise.resolve();

  if (!(name in modeLoaders)) return Promise.resolve();
  const loader = modeLoaders[name];

  // oxlint-disable-next-line promise/always-return -- side-effect only: caching loaded mode name
  return loader().then(() => { loaded.add(name); });
}
