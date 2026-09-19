/**
 * Vercel + Supabase inject POSTGRES_URL, not DATABASE_URL.
 * Accept every common name so the class hall connects after they tap Connect.
 */
export function resolveDatabaseUrl(env = typeof process !== "undefined" ? process.env : {}) {
  const keys = [
    "DATABASE_URL",
    "POSTGRES_URL_NON_POOLING",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
  ];
  for (const key of keys) {
    const trimmed = env[key]?.trim().replace(/^['"]|['"]$/g, "").trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

export function pgSsl(connectionString) {
  if (!connectionString) return undefined;
  if (/supabase\.(co|com)|pooler\.supabase|neon\.tech/i.test(connectionString)) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}
