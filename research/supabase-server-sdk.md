# Supabase server SDK and key handling

Reviewed 2026-10-19 against official Supabase documentation.

For this app’s public anonymous API routes, `@supabase/server` is appropriate for server-side API handling; Supabase describes `@supabase/ssr` for cookie-authenticated SSR sessions and `@supabase/server` for stateless request/API handling. Its `createAdminClient()` uses a Supabase secret key and bypasses Row Level Security, so it must remain server-only. The project has no Supabase login; the API must therefore validate every submitted session, answer and score before using the admin client.

Supabase’s current key guide says publishable keys are designed to be exposed online and are governed by RLS. Secret keys provide elevated full data access, bypass RLS, and must never be placed in browser code or source control. Legacy `anon` keys are low privilege; a public anon key is not a substitute for an elevated backend key.

Official sources:
- https://supabase.com/docs/guides/auth/choosing-a-server-package
- https://supabase.com/docs/reference/server/introduction
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/blog/introducing-supabase-server
