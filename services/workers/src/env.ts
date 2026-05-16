/** Shared environment binding shape — referenced by every route. */
export interface Env {
  CATALOG: KVNamespace;
  OPS: KVNamespace;
  DB: D1Database;
  COVERS: R2Bucket;
  PLAYBACK: DurableObjectNamespace;

  GEMINI_API_KEY: string;
  ADMIN_TOKEN: string;
  ALLOWED_ORIGINS: string;

  UPSTREAM_SAAVN_DEV: string;
  UPSTREAM_SAAVN_SUMIT: string;
  UPSTREAM_NEPOTUNE: string;
  UPSTREAM_JIOSAAVN_PRIVATE: string;
}
