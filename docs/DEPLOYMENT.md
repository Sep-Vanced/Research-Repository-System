# Deployment Guide (GitHub + Vercel)

Repository target:

- `https://github.com/Sep-Vanced/Research-Repository-System.git`

## 1. Push to GitHub

If the folder is not yet a git repo:

```bash
git init
git add .
git commit -m "docs: add comprehensive project setup and deployment documentation"
git branch -M main
git remote add origin https://github.com/Sep-Vanced/Research-Repository-System.git
git push -u origin main
```

If already initialized, just commit and push changes.

## 2. Import into Vercel

1. Open Vercel dashboard
2. Import the GitHub repository
3. Framework preset: Next.js (auto-detected)
4. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy

## 3. Post-deploy Checklist

- Confirm all protected routes redirect correctly for unauthenticated users
- Verify admin pages load only for `admin` users
- Test research submission and file upload
- Validate notifications and audit page behavior
- Test mobile dashboard shell and bottom navigation
