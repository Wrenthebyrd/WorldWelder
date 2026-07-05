# WorldWelder

A magical, futuristic workspace for forging worlds, characters, and stories —
world-building, character profiles, chapter drafts/official versions, and one-click
publishing to PDF, Word, TXT, and EPUB. Runs entirely in your browser (installable as a
PWA on desktop and Android); all data lives locally in IndexedDB.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build (type-checks, then builds + generates the service worker)
npm run preview  # preview the production build locally
```

## Data & privacy

- All projects, chapters, characters, world entries, and images are stored in your
  browser's IndexedDB — nothing is sent to a server.
- **Settings → Backup & Restore** lets you export everything to a single `.json` file
  (do this regularly!) and restore from one later. Restoring replaces all current data.
- **Settings → Passcode lock** adds a local PIN gate for this browser/device. It's a
  convenience lock, not strong security — anyone with disk access to this browser
  profile could still reach the underlying IndexedDB data.

## Deploying privately (so only you can access it)

Since this is a client-only app (no backend), the recommended setup for solo/private
use across your devices (desktop + Android phone) is:

1. Keep the GitHub repository **private**.
2. Connect it to **Vercel** or **Netlify** (both can deploy directly from a private
   repo on the free tier) — every push to your main branch auto-deploys.
3. You'll get a private, hard-to-guess URL. Open it on your phone and choose
   "Add to Home Screen" to install it like a native app (it's a PWA).
4. Optionally set a passcode in-app (Settings) as a second layer of casual protection.

Your project data itself never lives in the repo or on the host — it's local to each
browser you use the app in, so remember to use the backup/restore feature if you want
the same projects available on multiple devices.

## Tech stack

Vite, React, TypeScript, Tailwind CSS v4, Dexie (IndexedDB), Zustand, Tiptap,
Framer Motion, `@react-pdf/renderer`, `docx`, `jszip` (hand-built EPUB writer),
`vite-plugin-pwa`.
