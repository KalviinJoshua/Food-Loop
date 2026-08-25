// --- Browser Supabase client (public anon key only) --------------------------
// This is the ONLY Supabase client that runs in the browser. It uses the PUBLIC
// publishable/anon key exposed via Vite env vars (VITE_SUPABASE_URL /
// VITE_SUPABASE_ANON_KEY). The service-role secret is NEVER referenced here — it
// stays server-side (food/server/supabase.ts). If the env vars are absent the
// client is `null` and the app transparently falls back to the existing local /
// demo login, so nothing breaks when Supabase Auth isn't configured.
//
// `import.meta.env` is cast to `any` so this file has no dependency on Vite's
// generated client typings (the project's tsconfig is non-strict and does not
// include vite/client).

import { createClient } from '@supabase/supabase-js';

const env: any = (import.meta as any).env ?? {};

const url: string | undefined = env.VITE_SUPABASE_URL;
const anonKey: string | undefined = env.VITE_SUPABASE_ANON_KEY;

// True only when both public values are present. Components use this to decide
// whether to offer the secure Supabase login path.
export const isSupabaseConfigured: boolean = Boolean(url && anonKey);

// The client is created lazily-safe: `null` when unconfigured. Callers must
// null-check (or gate on `isSupabaseConfigured`) before use.
export const supabase: ReturnType<typeof createClient> | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
