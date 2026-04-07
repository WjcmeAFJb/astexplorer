// Maps CodeMirror mode names to Monaco language identifiers.
// Monaco ships with built-in support for all these languages,
// so no lazy-loading is needed (unlike the old CodeMirror setup).

const cmModeToMonaco: Record<string, string> = {
  javascript: 'javascript',
  css: 'css',
  'text/css': 'css',
  go: 'go',
  handlebars: 'handlebars',
  htmlmixed: 'html',
  lua: 'lua',
  markdown: 'markdown',
  mllike: 'fsharp', // Monaco uses fsharp for ML-like languages
  'text/x-ocaml': 'fsharp',
  php: 'php',
  protobuf: 'protobuf',
  pug: 'pug',
  python: 'python',
  rust: 'rust',
  sql: 'sql',
  vue: 'html', // Vue SFCs are HTML-like
  webidl: 'plaintext', // Monaco doesn't have WebIDL; use plaintext
  yaml: 'yaml',
  clike: 'java',
  'text/x-java': 'java',
  'text/x-scala': 'scala',
  xml: 'xml',
  graphql: 'graphql',
};

export function getMonacoLanguage(mode: string | { name: string } | undefined): string {
  if (mode === undefined) return 'plaintext';
  const name = typeof mode === 'string' ? mode : mode.name;
  return cmModeToMonaco[name] ?? 'plaintext';
}
