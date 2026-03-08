# Project Setup and Asset Requirements

This document describes the required setup for local development and production deployment.

## 1. Prerequisites

- Node.js 20+ (recommended LTS)
- npm 10+
- Supabase project (Postgres + Auth + Storage)

## 2. Install Dependencies

```bash
npm install
```

## 3. Environment Variables

Create `.env.local` in the project root and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 4. Database Setup (Supabase)

The app requires the tables, functions, and policies defined in:

- `supabase/schema.sql`

If your current Supabase instance already contains these objects and policies, you do not need to re-run the full file.
Use migrations for incremental changes in production.

## 5. Storage Buckets / Asset Infrastructure

The system expects these Supabase storage buckets:

- `research-files` (public): uploaded research file assets
- `avatars` (public): user profile images

Ensure policies allow:

- Public read of the above buckets
- Authenticated uploads for allowed operations

## 6. Project Assets in Repo

These project assets are used by the UI:

- App icon: `app/icon.png`
- Branding images:
  - `app/public/image/prmsu_logo.png`
  - `app/public/image/myprmsu.png`
  - `app/public/image/1bg.jpg`

If replacing them, keep consistent filenames or update imports accordingly.

## 7. Local Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## 8. Quality Checks

Run before pushing:

```bash
npm run lint
npm run build
```

## 9. Common Production Notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Verify role-based access and RLS behavior in Supabase before launch.
- Confirm notification/audit features have required DB objects and policies enabled.

## Credits

- Joseph M Mangubat
- SepVanced
