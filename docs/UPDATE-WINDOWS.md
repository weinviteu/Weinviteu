# Update your Windows folder to V3

Your current folder is:

```text
C:\Users\ADMIN\Downloads\weinviteu
```

1. In the terminal running the previous site, press **Ctrl+C** to stop it.
2. Close any editor terminal whose current directory is that folder.
3. Rename the old `weinviteu` folder to `weinviteu-backup` using File Explorer. Keep this backup if you added your own code, credentials or assets.
4. Extract the new ZIP into `C:\Users\ADMIN\Downloads`. The ZIP contains one top-level `weinviteu` folder. Avoid accidentally nesting it as `weinviteu\weinviteu`.
5. Open PowerShell and run:

```powershell
cd "C:\Users\ADMIN\Downloads\weinviteu"
npm install
npm run dev
```

6. Open http://localhost:3000. If Next.js chooses another port because 3000 is in use, use the address printed in the terminal.

The new homepage says **Make it a moment.** It has a collage of three different invitation designs. It does not have the old phone-mockup hero. The gallery lists **The Love Gazette**, **Midnight Pass**, **Our Golden Record**, and the other V3 designs.

## Change a template inside the editor

Open **Create invitation → Style → Invitation design**.

Choosing another design keeps your names, date, time, venue, story, gallery, music and RSVP settings. It applies that template's layout, default palette, typography and 3D entrance. You can then adjust those settings individually.

## Your own settings

If you added `.env.local` or custom assets to the previous project, copy only those intended files from the backup to the new project. The prototype still runs without credentials. If you edited source code yourself, compare those changes with the new source before merging them; this ZIP is based on the version created in this conversation.

## Checks

```powershell
npm run test
npm run typecheck
npm run lint
npm run build
```

Use Node.js 24 LTS (24.15.0+), or Node.js 22.22.2+.
