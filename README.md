# Research Repository System

A full-stack university research management platform built with Next.js 16, Supabase, and Tailwind CSS.

Repository: [https://github.com/Sep-Vanced/Research-Repository-System.git](https://github.com/Sep-Vanced/Research-Repository-System.git)

## Overview

This system supports the full research workflow:

- Role-based authentication (`admin`, `researcher`, `viewer`)
- Research submission and file uploads
- Admin review and publishing pipeline
- Search, filtering, bookmarks, and saved searches
- Notifications, alert subscriptions, and co-author invites
- Audit event tracking and admin security view
- Mobile-optimized dashboard experience

## Tech Stack

- Framework: Next.js 16.1.6 (App Router)
- Language: TypeScript
- UI: React 19, Tailwind CSS, Radix UI primitives, Lucide icons
- Backend: Supabase (Postgres, Auth, Storage, RLS)
- Validation: Zod
- Runtime patterns: Server Actions + React Server Components
- Tooling: ESLint, PostCSS

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables (`.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

3. Run development server:

```bash
npm run dev
```

4. Verify quality gates:

```bash
npm run lint
npm run build
```

## Documentation

- Setup + assets checklist: [docs/PROJECT_SETUP.md](docs/PROJECT_SETUP.md)
- Deployment guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Roles

| Role | Capabilities |
| --- | --- |
| Admin | Moderate research, manage taxonomy/users, review audit events |
| Researcher | Submit and manage research records, collaborate with co-authors |
| Viewer | Browse, search, and download published/approved research |

## Credits

- Joseph M Mangubat
- SepVanced
