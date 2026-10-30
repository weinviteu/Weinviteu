# V3 architecture

V3 replaces the public homepage with the original studio layout and introduces twelve separately structured invitation compositions. The historical notes below describe the earlier architecture; the V3 decisions in this section take precedence.

## New component map

- Home: CollectionHero (three distinct invitation cards), TemplateGallery in compact mode, ExperienceLab (Three.js plus music), occasion directory, process and feature sections.
- InvitationCard: twelve branch compositions sharing only common data bindings and container behaviour. DesignArtwork supplies original SVG illustration primitives.
- Design registry: `designKeys`, names and stable legacy template-ID mapping in data/designs.ts. The optional invitation `design` field is validated by Zod and included in export/share payloads. A missing field falls back to the stable ID mapping.
- Builder: a design selector updates only template/style defaults, preserving event content and soundtrack settings. Preview and public invitation receive the same selected design.
- InvitationExperience: design-specific classes control the full guest layout, including story treatment, countdown styling, gallery shape and section framing.
- Three.js and audio: the prior V2 scene and player continue to work. There are three entrance-model variants independent of the twelve graphic invitation compositions.

## Visual direction

Paper, charcoal, terracotta and soft green. Editorial typography and a collage hero replace the old phone-mockup composition. Each template has different hierarchy, borders, illustrations and date treatment. Container-relative units let the same design scale from gallery thumbnail to guest preview.

## Windows update

The user's local folder cannot be edited from this environment. The supplied ZIP is a fresh project snapshot; docs/UPDATE-WINDOWS.md explains replacing the folder while retaining a backup of user-specific files.

---

## Historical V1/V2 implementation notes



## Scope decision

The direct request was for a complete Next.js + Supabase-ready code folder, with database work deferred. The supplied markdown describes frontend V1; its older instruction to wait for approval is superseded by that direct request to build. No actual backend is created. The subsequently supplied PDF provides exact category copy, process copy, SEO title/description, and homepage heading structure.

## Page/component map

- Root layout: accessible skip link, Header, route content, Footer.
- Home: InvitationCard, occasion links, TemplateGallery, features and brand sections.
- Designs: server repository → client filter/search gallery.
- Template details: repository lookup, not-found handling, interactive card and editor link.
- Create: selected template → BuilderLoader → Builder → live InvitationCard.
- Preview: runtime-validated fragment → SharedInvitation → InvitationExperience.
- Public invitation: static example or validated custom fragment → InvitationExperience.
- How it works/About: static brand and help content.

## State and data

TemplateRepository is the replaceable read boundary. No UI calls a database. Invitation data is typed and validated with one Zod schema. Builder state is transient; export/import and encoded links are deliberate user actions. Preview-to-editor navigation carries the encoded state so the guest preview does not discard editing work.

User text is rendered as React text, never raw HTML. Incoming fragment/JSON values have size limits, field bounds, a restricted colour pattern, enums and date validation. Gallery/audio paths come from fixed enums, not arbitrary URLs. Google Maps, WhatsApp and calendar contents are encoded/escaped. Invalid or incomplete links display a recovery screen.

## Design system

Warm ivory page, forest-green text and buttons, muted olive and gold accents. Georgia editorial headings, system sans supporting text. Template themes: ivory, forest, rose, midnight. Invitation-specific CSS variables separate the chosen palette from the app chrome. Consistent 6–12px interface radii and arched invitation art.

The original cards retain CSS perspective for depth and pointer tilt. V2 adds the Three.js entrance described below. A native dialog provides gallery focus management and Escape close. Navigation, forms and buttons have visible keyboard focus. Animations and transitions respect reduced-motion preferences. Local image/audio assets avoid third-party asset availability and licensing issues.

## SEO

The supplied title, description and primary homepage H1 are implemented. PDF H2 sections, original occasion descriptions and the three-step flow are represented. Minimal Organization JSON-LD includes only product claims from the provided content; no invented ratings, address or pricing. Location references mention Bangalore and India naturally. No canonical domain is invented before deployment.

## Future boundaries

Persistent invitation storage, owner authentication/authorization, secure public RSVP submission, video/photo upload, moderation, short URLs and payments are separate future work. Marketing feature labels describe the intended experience, while database-dependent controls disclose the current demo state.

## V2 architecture

CinematicShowcase renders a working phone preview with three selectable collections. PalaceScene dynamically loads Three.js and builds an original scene from geometric primitives. Canvas DPR is capped at 1.5, the animation loop is throttled, and intersection/document visibility skip offscreen rendering. Materials, geometries, event listeners and renderer resources are cleaned up. The component retains CSS gates when WebGL fails.

CinematicEntrance coordinates the 1.9-second gate reveal. AudioPlayer remains mounted as the guest enters and scrolls. Its imperative play handle is called only within the user's opening click, preserving the browser gesture needed for audio. Guests can disable sound before opening or pause/mute it afterward. No audio recording or microphone permission is involved.

The invitation schema adds defaulted entrance, volume and custom HTTPS audio fields so earlier shared links remain usable. Audio files are local assets; remote custom songs are loaded directly by the guest's browser from the supplied URL. No upload/storage integration is implied.

The revised homepage H1 follows the requested cinematic visual direction. Existing title/description and supporting SEO sections remain.
