# Local verification — 3 October 2026

- Next.js upgraded to 16.3.6 to resolve the installed version's critical ImageResponse advisory.
- 16 regression tests pass using Node 24.19.0 (the system Node 24.7.0 is below the project's documented minimum).
- TypeScript check and production build pass.
- ESLint passes with eight existing/native-image optimization warnings and no errors.
- Headless Chrome loaded all nine included templates in sandboxed frames without JavaScript errors. Edited text persisted after rebuilding/reopening with replacement photos.
- Production HTTP checks: old `admin_auth=authenticated` cookie redirects to login (307). Anonymous order reads, settings writes, email sends, and template uploads return 401.
- Tests cover verified admin authorization, forged/expired/non-admin sessions, cross-site writes, saved text/music/photos, literal-text rendering, order identity preservation, failed-upload/database cleanup, archived templates, and email failure handling.

## Not yet verified against the live project

The Supabase migration, administrator provisioning, live RLS/storage behavior, and real email delivery require the setup steps in `admin-setup.md`. No live database data was changed and no emails were sent during verification.

`npm audit` still reports five high-severity dependency entries in the development-only Next ESLint → fast-glob → micromatch → braces chain. The registry reported no patched braces version (latest 3.0.3). Do not use the audit's suggested downgrade to Next 14 lint configuration. Recheck for a compatible patch when available; this remaining tooling advisory is not claimed fixed.
