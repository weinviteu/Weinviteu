# V3 verification

The V3 source was checked with:

- `npm run build` — production compilation and page generation.
- `npm run typecheck` — strict TypeScript.
- `npm run lint` — ESLint.
- `npm run test` — component and data-contract tests using Vitest/jsdom.

V3 adds checks that all twelve compositions render user names/venues, legacy IDs select the intended design, template changes preserve event content and music, and redesigned gallery filters/link targets work.

Automated test coverage also includes old invitation compatibility, Unicode share-link round trips with entrance/audio settings, HTTPS audio URL validation, all template data, playback requests only after interaction, play/pause, mute/volume, audio error feedback, silent invitations, custom audio sources, the CSS fallback when WebGL is unavailable, gate timing, opening without sound, and editor settings carried into full preview.

Media playback methods are mocked in component tests. These tests verify controls and state, not audible playback or GPU-rendered visuals. Included WAV files are checked as valid 32-second local audio assets.

The supplied reference homepage was visually inspected in the available browser. That browser rejects the local development address with ERR_BLOCKED_BY_CLIENT, so the V3 WebGL rendering, responsive visual appearance and actual browser audio could not be visually/audibly verified in this session. No claim of V3 device/browser visual certification is made. V1's earlier browser checks do not substitute for those checks on this updated version.

## Before launch

1. Run `npm install`, `npm run dev`, then open http://localhost:3000 in Chrome.
2. Check the homepage collage and twelve distinct designs in the directory.
3. Use the homepage 3D lab: switch entrances, open gates, and play/pause sound.
4. Open `/create`, go to Style, switch Invitation design, and confirm your existing event details remain. Then try each 3D entrance.
5. Go to Extras; try each included track, set volume, and optionally enter your own public HTTPS audio URL.
6. Open Full preview. Confirm music starts after the opening click, persists after the gates open, and responds to pause/mute/volume.
7. Return to the editor and confirm your details and soundtrack settings remain.
8. Open without music, choose No music, and test reduced-motion settings.
9. Check on iOS Safari, Android Chrome and desktop at phone/tablet widths before deployment.
10. Test your custom audio URL on the hosted HTTPS domain. It must be a directly playable public audio file, not a sharing page or a URL that expires.

Database/RSVP persistence remains intentionally deferred. No live Supabase project, payment provider, user account or cloud media upload was used.
