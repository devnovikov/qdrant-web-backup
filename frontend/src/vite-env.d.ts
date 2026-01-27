/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Enable MSW mocks ("true" to enable, any other value to disable) */
  readonly VITE_MOCK_ENABLED: string;
  /** API URL for production (optional, uses relative path by default) */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}