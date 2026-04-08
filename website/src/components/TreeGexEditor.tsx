import * as monaco from 'monaco-editor';
import Editor from './Editor';
import { ensureLanguageRegistered } from '../monacoLanguages';

// tree-gex type definitions for Monaco IntelliSense.
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
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      allowJs: true,
      checkJs: false,
      noEmit: true,
      strict: false,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    });

    // Provide tree-gex types
    ts.typescriptDefaults.addExtraLib(
      `declare module 'tree-gex' {\n${treeGexDts}\n}`,
      'ts:tree-gex/index.d.ts',
    );

    // Declare the global `ast` variable available in user code
    ts.typescriptDefaults.addExtraLib('declare const ast: any;', 'ts:globals/ast.d.ts');
  });
}

export default class TreeGexEditor extends Editor {
  static displayName = 'TreeGexEditor';

  componentDidMount() {
    // Start configuring TS defaults (async, but doesn't block editor creation)
    configureTypeScriptDefaults();

    // Create the editor with all event bindings (reactive to edits)
    super.componentDidMount();

    // Override the language to TypeScript
    void ensureLanguageRegistered('typescript').then(() => {
      const model = this.monacoEditor?.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, 'typescript');
      }
    });
  }
}

TreeGexEditor.defaultProps = Object.assign({}, Editor.defaultProps, {
  mode: 'typescript',
});
