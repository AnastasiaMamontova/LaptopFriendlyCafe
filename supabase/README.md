# Supabase backend

The catalogue uses `public.cafes` for café records and the public `cafe-photos`
Storage bucket for images. Photos are limited to 10 MB each. The editor resizes
selected photos before uploading them.

## Initial setup

1. Supply `SUPABASE_PROJECT_ID` (the project reference) and
   `SUPABASE_ACCESS_TOKEN` through your local shell or managed environment.
   Keep the access token outside the repository.
2. Run `npm run setup:backend` from the repository root. Node.js and `curl` are
   required. The script checks the existing public tables and applies
   `migrations/202611100001_cafes.sql` through the Supabase Management API.
3. The script writes ignored `.env.local` containing `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`. Restart the dev server or rebuild the PWA/APK after
   changing these values.

Alternatively, run the migration in the Supabase SQL editor and copy the
project URL and public anon key into `.env.local` using `.env.example` as a
template. For Cloudflare Pages, configure the same two `VITE_` variables in the
build settings. The project URL and public anon key are intentionally included
in browser and APK builds. Never use the Management API token or a
`service_role` key for either variable.

## Access model

This version intentionally has no sign-in, accounts, or permission levels.
Anonymous clients can read, create, update, and delete café records and photos.
Row-level security is enabled with policies allowing those operations, as
required by the single-user product design. The photo policy applies only to
`cafe-photos`; it does not grant access to other buckets.

Records and photos can also be managed manually through Supabase Table Editor
and Storage. `photos` is an array of public image URLs. Café ratings range from
1.0 to 5.0 in increments of 0.1. `noise` is `quiet`, `moderate`, or `lively`.
Coordinates are stored as numeric `lat` and `lng`. App edits automatically
update `updated_at` and remove discarded photos from this app's bucket.

The setup is repeatable and does not insert demonstration cafés. Example cards
in the app are local illustrations and are never written to the live database.
