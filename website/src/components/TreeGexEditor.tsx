import * as monaco from 'monaco-editor';
import Editor from './Editor';
import { ensureLanguageRegistered } from '../monacoLanguages';

// Inline tree-gex type definitions for Monaco TypeScript IntelliSense.
import treeGexDts from '../treegex.d.ts.txt?raw';

let typesConfigured = false;

async function configureTypeScriptDefaults() {
  if (typesConfigured) return;
  typesConfigured = true;

  await ensureLanguageRegistered('typescript');

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

  ts.typescriptDefaults.addExtraLib(
    `declare module 'tree-gex' {\n${treeGexDts}\n}`,
    'ts:tree-gex/index.d.ts',
  );
}

export default class TreeGexEditor extends Editor {
  static displayName = 'TreeGexEditor';

  componentDidMount() {
    // Configure TS types first, then create editor
    void configureTypeScriptDefaults().then(() => {
      // Call parent which creates the Monaco editor
      super.componentDidMount();

      // Now override language to TypeScript
      if (this.monacoEditor) {
        void ensureLanguageRegistered('typescript').then(() => {
          const model = this.monacoEditor?.getModel();
          if (model) {
            monaco.editor.setModelLanguage(model, 'typescript');
          }
        });
      }
    });
  }
}

TreeGexEditor.defaultProps = Object.assign({}, Editor.defaultProps, {
  highlight: false,
  mode: 'typescript',
});
