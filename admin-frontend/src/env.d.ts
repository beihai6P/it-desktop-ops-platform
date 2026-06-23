interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_API_RETRY_COUNT: string;
  readonly VITE_API_RETRY_DELAY: string;
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_LOGGING_ENABLED: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}