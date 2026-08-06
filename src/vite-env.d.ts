/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Point the editor at a local static-page-editors instance. */
  readonly VITE_EDITOR_API_URL?: string;
  /** Project id the editor saves under — a scratch project when testing. */
  readonly VITE_EDITOR_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
