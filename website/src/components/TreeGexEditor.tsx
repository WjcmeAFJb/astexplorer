import * as monaco from 'monaco-editor';
import Editor from './Editor';
import { ensureLanguageRegistered } from '../monacoLanguages';

// tree-gex type definitions for Monaco IntelliSense.
import treeGexDts from '../treegex.d.ts.txt?raw';

// Exported names from tree-gex (parsed once from the .d.ts export statement)
const TREE_GEX_NAMES = (() => {
  const m = treeGexDts.match(/export\s*\{([^}]+)\}/);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((s) =>
      s
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)
        .pop()!
        .trim(),
    )
    .filter(Boolean);
})();

let configured = false;
let providerRegistered = false;

/**
 * Create hidden models containing type definitions.
 * Monaco's JS language service picks up all JS-language models and shares
 * type information. The .d.ts URI makes the TS compiler treat them as
 * declaration files, enabling full IntelliSense for tree-gex functions.
 */
function configureTypeDefs() {
  if (configured) return;
  configured = true;

  // Raw .d.ts content has top-level `export { ... }` — it's a proper module.
  monaco.editor.createModel(
    treeGexDts,
    'javascript',
    monaco.Uri.parse('file:///node_modules/tree-gex/index.d.ts'),
  );

  monaco.editor.createModel(
    '{ "name": "tree-gex", "version": "0.0.8", "types": "index.d.ts" }',
    'javascript',
    monaco.Uri.parse('file:///node_modules/tree-gex/package.json'),
  );

  monaco.editor.createModel(
    'declare const ast: unknown;',
    'javascript',
    monaco.Uri.parse('file:///globals.d.ts'),
  );
}

/**
 * Register a completion provider that offers auto-import suggestions for
 * tree-gex functions. When the user types a function name that isn't
 * imported yet, we suggest it and add the import statement automatically.
 */
function registerAutoImportProvider() {
  if (providerRegistered) return;
  providerRegistered = true;

  monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      if (!word.word) return { suggestions: [] };

      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const text = model.getValue();
      // Parse existing tree-gex import
      const importMatch = text.match(/import\s*\{([^}]*)\}\s*from\s*['"]tree-gex['"]/);
      const alreadyImported = new Set(
        importMatch
          ? importMatch[1].split(',').map((s) =>
              s
                .trim()
                .split(/\s+as\s+/)
                .pop()!
                .trim(),
            )
          : [],
      );

      const suggestions: monaco.languages.CompletionItem[] = [];

      for (const name of TREE_GEX_NAMES) {
        if (alreadyImported.has(name)) continue;

        // Build the additionalTextEdits to add/extend the import
        const edits: monaco.languages.TextEdit[] = [];
        if (importMatch) {
          // Extend existing import: add this name
          const importStart = text.indexOf(importMatch[0]);
          const braceContent = importMatch[1];
          const braceStart = text.indexOf('{', importStart) + 1;
          const pos = model.getPositionAt(braceStart + braceContent.length);
          edits.push({
            range: {
              startLineNumber: pos.lineNumber,
              startColumn: pos.column,
              endLineNumber: pos.lineNumber,
              endColumn: pos.column,
            },
            text: `, ${name}`,
          });
        } else {
          // Add a new import at top of file
          edits.push({
            range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
            text: `import { ${name} } from "tree-gex";\n`,
          });
        }

        suggestions.push({
          label: { label: name, description: 'tree-gex' },
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: name,
          range,
          additionalTextEdits: edits,
          sortText: '0' + name, // sort before other suggestions
        });
      }

      // Also suggest `ast` global
      suggestions.push({
        label: { label: 'ast', description: 'global' },
        kind: monaco.languages.CompletionItemKind.Variable,
        detail: 'const ast: unknown — the parsed AST',
        insertText: 'ast',
        range,
        sortText: '0ast',
      });

      return { suggestions };
    },
  });
}

export default class TreeGexEditor extends Editor {
  static displayName = 'TreeGexEditor';

  componentDidMount() {
    configureTypeDefs();
    registerAutoImportProvider();

    // Load both JS (for IntelliSense + highlighting) and TS (for hover
    // code block syntax highlighting — hover renders TS code fences).
    void ensureLanguageRegistered('javascript');
    void ensureLanguageRegistered('typescript');

    super.componentDidMount();
  }
}

TreeGexEditor.defaultProps = Object.assign({}, Editor.defaultProps, {
  mode: 'javascript',
});
