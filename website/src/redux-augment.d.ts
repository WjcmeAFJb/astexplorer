import 'react-redux';

declare module 'react-redux' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultRootState {
    showSettingsDialog: boolean;
    showSettingsDrawer: boolean;
    showShareDialog: boolean;
    loadingSnippet: boolean;
    forking: boolean;
    saving: boolean;
    cursor: number | null;
    error: Error | null;
    showTransformPanel: boolean;
    activeRevision: unknown;
    selectedRevision?: unknown;
    parserSettings: Record<string, Record<string, unknown>>;
    parserPerCategory: Record<string, string>;
    workbench: {
      parser: string;
      parserSettings: Record<string, unknown> | null;
      parseResult?: unknown;
      parseError?: unknown;
      code: string;
      keyMap: string;
      initialCode: string;
      transform: {
        code: string;
        initialCode: string;
        transformer: string | null;
        transformResult: unknown;
      };
    };
    enableFormatting: boolean;
  }
}
