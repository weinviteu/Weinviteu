# Connecting Supabase after V1

This project does not create a database. No migration, credentials, public write policies or database-side functions are applied. Configure your schema after the frontend is approved.

## Suggested future data model (not an applied schema)

- `templates`: stable id, display name, category, theme, accent, preview assets, active flag.
- `invitations`: UUID id, owner user id, unique random public slug, versioned content JSON, draft/published state, timestamps.
- `rsvps`: invitation id, guest name, attendance, guest count, timestamps. Define duplicate submission and retention rules deliberately.
- Private storage for original media, with controlled derivative delivery for published invitations.

## Integration order

1. Set up Supabase Auth for hosts before persistent editing.
2. Generate database TypeScript types and pass them to createClient.
3. Create tables with RLS enabled. An owner must only read/write their own drafts and guest responses.
4. Allow public reads only of explicitly published invitation fields. Never expose owner emails or guest response lists publicly.
5. Keep templates public-read and authorized-editor-write.
6. Replace the implementation behind TemplateRepository; return the existing Template interface and propagate real errors.
7. Create a separate invitation repository for authenticated save/load/publish actions.
8. Build rate-limited, validated RSVP submission with narrowly scoped server permissions; do not give arbitrary anonymous updates to RSVP tables.
9. Connect uploads with type/size checks, safe storage policies, and cleanup of replaced media.
10. Replace URL-payload demos with persistent random-slug invitation URLs.

The optional browser helper returns null without environment configuration. No production repository or authentication is implied by the presence of this helper. Never enable broad anonymous writes to make a demo appear connected.

Timezones are stored as explicit UTC offsets in V1. If you need daylight-saving regions, migrate to IANA timezone names and a timezone-aware date library before production use.
