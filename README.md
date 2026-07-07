# 🧠 Second Brain

A personal, local-first dashboard for your work — capture **thoughts**, **ideas**,
**tasks**, **document/link references**, and **things to track**, all in one place.

Every item on the board is stored as a **plain markdown file** on your disk. The
app is a friendly UI over a folder of `.md` files — which means your notes are
portable, greppable, diff-able, and (the point) directly usable by **Claude Code
routines and scheduled agents**.

No account, no cloud. Data stays on your machine.

## Features

- **Quick capture bar** — pick a type, type a title, press Enter. Done.
- **Five collections:** 💭 Thoughts · 💡 Ideas · ✅ Tasks (status / priority /
  due) · 🔗 References (links + notes) · 📈 Trackers (timestamped value log).
- **Dashboard** — counts, open tasks, recent thoughts/ideas, trackers, top tags.
- **Global search**, **tags & filtering**, **dark / light theme**.
- **JSON export/import** for backups, on top of the markdown files.
- **Markdown files are the source of truth** — edit them by hand or from a
  script/agent and the app reflects the change on reload.
- **Live updates** — the server watches the data dir and pushes a change event
  (Server-Sent Events) when a `.md` file is added or edited, so a file dropped in
  by a script or agent appears in the open browser without a manual refresh.

## How your data is stored

Each item is one file under `brain/<collection>/<slug>--<id8>.md`:

```markdown
---
id: "f6b6ecff-1a44-40e4-baf4-f84da250dd3d"
type: "task"
title: "Send the sprint summary to the team channel"
tags: ["work", "comms"]
status: "done"
priority: "med"
due: "2026-06-25"
created: "2026-06-22T16:07:35.674Z"
updated: "2026-06-22T16:07:35.674Z"
---

Posted in #platform-updates. Followed up with the PM.
```

- Front-matter values are JSON-encoded, which is also valid YAML — so any YAML or
  front-matter tool (and Claude) can read them, and they round-trip losslessly.
- The body (everything after the second `---`) is freeform markdown.
- Folder is chosen by `type`: `thoughts/`, `ideas/`, `tasks/`, `references/`,
  `trackers/`.
- Default data directory is `./brain` — override with the `BRAIN_DIR` env var
  (e.g. point it at a synced/Obsidian vault).

## Using it with Claude Code routines / schedules

Because the board is just markdown files, a scheduled Claude Code agent can
operate on them directly. Examples:

- *"Each morning, read `brain/tasks/*.md`, list everything `status: todo` due in
  the next 2 days, and draft a plan."*
- *"Summarize today's new `brain/thoughts/` into a single digest note."*
- *"For any task mentioning a Jira key, check its status and append a note."*

An agent can also **create or edit** items by writing `.md` files in the same
format — the app picks them up on next load. Point the routine at this repo's
`brain/` folder (or your `BRAIN_DIR`).

## Run it

The app is a React UI served by a tiny local Node server. The server owns the
markdown files (the browser never touches your filesystem directly).

```bash
npm install

# Develop (two terminals): UI hot-reload + the file/API server
npm run server     # API + data on http://localhost:6767
npm run dev        # UI on http://localhost:5173 (proxies /api to the server)

# Use it for real (single process serving UI + API):
npm run build
npm start          # open http://localhost:6767

npm test           # run unit tests (Vitest)
```

> Build on your personal PC; to use on another machine, copy the repo and run
> `npm install && npm run build && npm start` there. The `brain/` folder holds
> your notes (gitignored by default).

### With Docker

A multi-stage `Dockerfile` builds the UI and serves it from the zero-dependency
Node server; `docker-compose.yml` bind-mounts your host `./brain` folder so your
markdown stays on disk and is the source of truth.

```bash
docker compose up --build      # open http://localhost:6767
```

Files you (or an agent) drop into `./brain` show up live in the running app, and
items created in the app are written back to the same folder. Override the host
data location by changing the `./brain` bind-mount in `docker-compose.yml`.

## Tech

- **Vite + React + TypeScript + Tailwind** — the UI.
- **Node `http` server (zero dependencies)** — `server/`, serves the built app
  and a small items API; reads/writes the markdown files.
- Front-matter (de)serialization and the file store are unit-tested.

## Project layout

```
server/
  markdown.js     # item <-> markdown front-matter (de)serialization (tested)
  store.js        # file-based CRUD over ./brain (tested)
  index.js        # zero-dep HTTP server: /api/items + static dist
src/
  types.ts        # unified Item model + per-type metadata
  lib/            # util, theme, hash router
  store/
    api.ts        # browser → /api client
    StoreContext.tsx  # React context, optimistic updates, connection state
  components/      # Sidebar, QuickCapture, ItemCard, ItemForm, Modal, …
  views/          # Dashboard, CollectionView, SearchView
brain/            # YOUR DATA — one .md per item (gitignored)
```

## Backups

`brain/` is plain text, so git/Time-Machine/Dropbox all work. The in-app
**Export** also writes a single JSON snapshot; **Import** merges or replaces.

## Note on this environment

During setup, the locally-cached `browserslist` package (pulled in by
`autoprefixer`) was found corrupted on disk, which broke Vite's dev transform.
Fix applied: `autoprefixer` was dropped from the PostCSS pipeline (unnecessary
for a modern-browser local app) and the corrupted `browserslist/node.js` was
repaired. The backend deliberately uses **zero npm dependencies** (Node built-ins
only) to stay robust against this. If a future `npm install` reintroduces the
corruption, the error names the exact file/line to restore.
