# Orbit — product work, in motion

Orbit is an original, keyboard-first project and issue workspace built with Next.js, React, TypeScript, Prisma, PostgreSQL, Zustand and dnd-kit.

## Quick start

```bash
npm install
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000` and sign in with the seeded development account below. The workspace, members, projects, cycles and issues are loaded from PostgreSQL; core issue changes are persisted through authenticated server actions.

## Production data setup

```bash
cp .env.example .env
docker compose up -d db
npm run db:generate
npm run db:migrate
npm run db:seed
```

Set `DATABASE_URL` and `AUTH_SECRET` in `.env`. The Prisma model is PostgreSQL-native and covers workspaces, membership, teams, issue sequencing, projects, cycles, labels, comments, activity, notifications and saved views. Production mutations should be routed through server actions backed by the repository layer; the checked-in demo adapter exists so reviewers can use the product without secrets or a database.

After seeding, sign in with `member1@orbit.local` and password `OrbitDemo2026`. The other seeded member addresses use the same development-only password.

## Commands

- `npm run dev` — start the local development server
- `npm run typecheck` — run strict TypeScript checks
- `npm run lint` — run ESLint
- `npm run test` — run unit tests
- `npm run build` — create the production build
- `npm run db:migrate` — create/apply a Prisma development migration
- `npm run db:seed` — seed the development database

## Architecture notes

- Workspace routes are handled by `app/[workspaceSlug]/[[...path]]` and rendered through a shared shell.
- Zustand holds the hydrated workspace snapshot and transient interface state. Only theme and sidebar preferences persist in the browser; workspace records remain authoritative in PostgreSQL.
- Issue board ordering uses sparse numeric ranks. A move is normally the midpoint between neighbours; ranks are compacted only when the gap is exhausted.
- Issue numbers must be allocated in a database transaction by atomically incrementing `Team.issueCounter`.
- `deletedAt` is used on issues, projects and comments to preserve activity history.
- Rich-text bodies are modelled as sanitized JSON. The first UI slice intentionally uses plain text editing until a production sanitizer/editor pair is connected.

## Current implementation

The first coherent product slice includes a responsive application shell, workspace navigation, issue list and Kanban modes, search and filters, issue creation, inline side-detail editing, status/priority/assignee updates, project and cycle summaries, inbox, settings, command palette, keyboard shortcuts, dark mode and optimistic drag-and-drop.

Authentication is implemented with Auth.js v5 using secure JWT cookies, a credentials provider, optional Google/GitHub providers, bcrypt password hashing, email verification, one-hour password reset links and database-backed rate limiting. Set `AUTH_SECRET` before starting the application. OAuth buttons appear only when their provider variables are configured.

The server persistence layer includes workspace-scoped repositories, cursor pagination, transactional team issue numbering, relation ownership checks, structured activity creation, assignment notifications, optimistic concurrency hooks and soft deletion. The visible workspace now loads its issues, members, statuses, projects, cycles, labels and notifications from PostgreSQL. Issue creation, title and description edits, status, priority, assignee, project, cycle, estimate and due-date changes, board moves and deletion use authenticated server actions with optimistic client feedback.
