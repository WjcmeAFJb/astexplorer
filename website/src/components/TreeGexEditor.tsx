import * as monaco from 'monaco-editor';
import Editor from './Editor';
import { ensureLanguageRegistered } from '../monacoLanguages';
import type { EditorProps } from './Editor';

// Inline tree-gex type definitions for Monaco TypeScript IntelliSense.
// This is a copy of node_modules/tree-gex/dist/index.d.ts loaded as a raw string.
import treeGexDts from '../treegex.d.ts.txt?raw';

let typesConfigured = false;

function configureTypeScriptDefaults() {
  if (typesConfigured) return;
  typesConfigured = true;

  void ensureLanguageRegistered('typescript').then(() => {
    const ts = monaco.languages.typescript;
    if (!ts) return;

    ts.typescriptDefaults.setCompilerOptions({
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      allowJs: true,
      checkJs: true,
      noEmit: true,
      strict: false,
      esModuleInterop: true,
    });

    // Provide tree-gex types so `require('tree-gex')` gets IntelliSense
    ts.typescriptDefaults.addExtraLib(
      `declare module 'tree-gex' {\n${treeGexDts}\n}`,
      'ts:tree-gex/index.d.ts',
    );
  });
}

export default class TreeGexEditor extends Editor {
  static displayName = 'TreeGexEditor';

  componentDidMount() {
    configureTypeScriptDefaults();
    super.componentDidMount();

    // Override the language to TypeScript after the editor is created
    if (this.monacoEditor) {
      void ensureLanguageRegistered('typescript').then(() => {
        const model = this.monacoEditor?.getModel();
        if (model) {
          monaco.editor.setModelLanguage(model, 'typescript');
        }
      });
    }
  }
}

TreeGexEditor.defaultProps = Object.assign({}, Editor.defaultProps, {
  highlight: false,
  mode: 'typescript',
});
