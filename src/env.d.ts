/// <reference types="vite/client" />

// Declare all VITE_ env variables used in the app so TypeScript
// treats them as string instead of any.
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_ENV: "development" | "production";
  readonly VITE_GOOGLE_PLACES_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
