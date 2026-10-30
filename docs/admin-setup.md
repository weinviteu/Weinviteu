# Admin deployment and verification

The admin now uses Supabase Auth. The old plaintext `admins` table and `ADMIN_PASSWORD` setting are no longer used. Existing login cookies are intentionally rejected.

1. Back up the Supabase database and run `supabase/migrations/202610030001_admin_security_and_drafts.sql` in its SQL editor. This preserves rows, adds draft fields, replaces demo policies, and restricts uploads. For a fresh database use `supabase_setup.sql` instead.
2. Create the administrator in Supabase Authentication → Users. Use a strong password. In the SQL editor set the server-managed role for that specific account (replace YOUR_ADMIN_EMAIL with the email you just created):
   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
   where email = 'YOUR_ADMIN_EMAIL';
   ```
   Only `app_metadata` grants access; editable user metadata does not. Sign in again after granting the role. The session expires with the Supabase access token (normally one hour); sign in again to continue. Do not disable Supabase Auth rate limiting.
3. Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the environment. To enable email, add server-only `RESEND_API_KEY`, a verified `EMAIL_FROM`, and `SITE_URL` (the canonical HTTPS site URL). No service-role key is required by this application.
4. Remove obsolete plaintext credentials from the old `admins` table after confirming the new administrator works. Local credential-note files are ignored by Git.
5. Configure real studio contact details in Settings. Unimplemented tracking, notification preferences, and fake reset controls have been removed rather than presented as working features.

Template HTML uploads allow up to 100 MB (104857600 bytes). Apply `supabase/migrations/202610140005_template_upload_limit.sql` after database setup and configure the Supabase project's global Storage file-size limit to at least 100 MB. The application allows 105 MB requests to include the optional cover and multipart overhead; deployment ingress must allow this request size too.

Supabase Free projects cap the global per-file limit at 50 MB. SQL cannot raise that plan limit; 100 MB files require a plan that supports them and a global limit configured in Storage Settings.

## Acceptance checks on a staging database

- Missing, forged, expired and non-admin sessions cannot access admin pages or write APIs.
- Anonymous clients may read enabled templates/contact details and submit a new inquiry. They cannot list orders or upload, change settings, or modify templates. Verify policies using both anon and non-admin authenticated clients.
- Create a draft, edit several text fields, upload a photo, change colors, and upload music. Save, open the link, refresh it, and reopen the same order: customization should persist and the order ID should remain the same.
- Switch templates and check the discard warning. Text edits are literal text, not HTML.
- A failed/unconfigured email leaves the saved link available and does not mark the order delivered. Successful provider acceptance changes status; acceptance is not a guarantee of inbox delivery.
- Upload a template, preview it, disable it, and verify its removal from public listings. Previously saved invitations remain available after a template is deleted.
- Check Orders search, completion, and dashboard counts.

HTML templates execute inside sandboxed previews and responses. Templates relying on same-origin cookies/localStorage need adjustment; storage access is intentionally isolated. Text editing targets stable DOM paths and is reapplied after dynamic rendering. Canvas-drawn text/artwork requires a template-specific adapter. Older orders without source/editor data cannot recover previous edits automatically; their existing published links are retained.

Saved draft links are public to anyone who receives the unguessable link, matching the site's existing sharing behavior. Do not share draft links until ready.
