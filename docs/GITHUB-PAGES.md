# Quevian on GitHub Pages

GitHub Pages builds the existing marketing website from the same React components as the hosted app. Its interactive example workspace has ticket, dispatch, and project views. Login, signup, and customer portal links open the hosted Quevian app, because Pages cannot run the Worker API, D1 database, R2 uploads, or server authentication.

In repository Settings → Pages, select **GitHub Actions** under Source. The `Publish Quevian website` workflow deploys after each push to main, and can also be run manually from Actions.

Local build: `npx vite build --config vite.pages.config.ts`

Only `pages-dist` is published; server code, environment files, and customer records are not part of the Pages artifact. No provider credentials are required for this build. Supabase email account activation remains a separate task documented in `docs/auth/ACTIVATION.md`.
