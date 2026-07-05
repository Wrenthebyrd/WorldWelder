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

## Deployment

This repo deploys straight from GitHub via **GitHub Pages** — `.github/workflows/deploy.yml`
builds the app and publishes it on every push to `main`. One-time setup on GitHub:
Settings → Pages → set **Source** to "GitHub Actions". After that, pushing to `main` is
all it takes to update the live site.

Note on privacy: keeping the repository **private** hides the source code, but a
published GitHub Pages site itself is always reachable at its URL — GitHub only offers
private Pages sites on Enterprise Cloud, not on individual/Pro accounts. That's low-risk
here since this is a client-only app: your actual projects/characters/chapters live only
in your own browser's IndexedDB, never in the repo or on the host. Anyone who found the
URL would just see an empty app shell, not your content — and the in-app passcode lock
(Settings) adds a further deterrent. If you ever want the *site* itself gated too (not
just the source), Vercel/Netlify support private deployments and can be swapped in
instead of Pages.

Once deployed, open the URL on your phone and choose "Add to Home Screen" to install it
like a native app (it's a PWA). Your project data itself never lives in the repo or on
the host — it's local to each browser you use the app in, so remember to use the
backup/restore feature if you want the same projects available on multiple devices.

## Tech stack

Vite, React, TypeScript, Tailwind CSS v4, Dexie (IndexedDB), Zustand, Tiptap,
Framer Motion, `@react-pdf/renderer`, `docx`, `jszip` (hand-built EPUB writer),
`vite-plugin-pwa`.
