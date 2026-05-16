# Mini Lead CRM — Frontend

A single-page lead management CRM built for the Superleap Frontend Intern assessment. Browse, search, create, edit, delete, and move leads through a constrained status pipeline — with a list view, a Kanban board, bulk actions, and virtualization for large datasets.

All three assessment levels are implemented.

---

## Setup (two commands)

The mock server lives in the sibling folder (`../`). Open two terminals.

```bash
# 1. mock API (from the repo root, in /mock-server)
npm install && npm start            # starts http://localhost:4000

# 2. frontend (in this folder, /mock-server/frontend)
npm install && npm run dev          # starts http://localhost:5173
```

Open <http://localhost:5173>. The Vite dev server proxies `/api/*` to the mock on `:4000`, so you don't need to touch any env vars.

Want to stress-test loading/error states? Run the mock with chaos mode:

```bash
MOCK_LATENCY_MS=400 MOCK_FAILURE_RATE=0.1 npm start
```

Want a 5,000-lead dataset for the virtualization test?

```bash
node generate.js 5000               # rewrites seed.json
npm start                           # then restart the mock
```

### Scripts

| Script              | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Vite dev server with HMR                 |
| `npm run build`     | TypeScript check + production build      |
| `npm run preview`   | Preview the production build             |
| `npm run typecheck` | `tsc --noEmit` across the project        |

---

## Tech stack and why

**React 18 + Vite + TypeScript.** React because the assessment expects it and the component model fits a CRUD-heavy UI; Vite for instant HMR and zero-config TS; TypeScript because every field on `Lead` and every status transition is genuinely typed, and the brief explicitly says it's preferred.

**TanStack Query for server state.** The brief grades on async handling and optimistic updates. React Query gives you caching, request deduplication, declarative loading/error states, optimistic mutations with rollback, and a single source of truth for the leads cache — all of which would otherwise be hand-rolled. Mutations live in `src/hooks/useLeads.ts` so the optimistic patches are reused by both the table dropdown and the Kanban DnD handler, not reimplemented per UI surface.

**URL params for UI state (no global store).** Filter, search, sort, and the leads-vs-board view all live in `useSearchParams` via the `useUrlFilters` hook. This gives shareable URLs for free, persists state across navigation, and removes the need for Zustand/Redux. Local UI state (selected row IDs, dialog open/closed) is plain `useState` — it doesn't belong in the URL.

**react-hook-form + zod for forms.** RHF keeps re-renders local to the field; zod centralizes the validation schema so the rules are the same on every form. The submit button is disabled until the form is valid, and server errors (e.g. 422 from the mock) are surfaced inline rather than as raw JSON.

**Tailwind CSS + shadcn/ui primitives.** Tailwind for fast, consistent spacing/typography; a small set of shadcn primitives (button, dialog, dropdown-menu, checkbox, select, label, badge, table) for accessibility (focus management, keyboard nav, escape-to-close) without pulling in a giant kit. Higher-level components (`LeadsTable`, `KanbanCard`, `StatusBadge`, `BulkActionBar`, etc.) are all hand-built so the submission shows judgment, not just stock pieces.

**@dnd-kit for the Kanban board.** Chosen over `react-beautiful-dnd` (unmaintained) and `react-dnd` (heavier, HTML5-DnD-first API). `@dnd-kit` is accessible by default (keyboard sensor included), modular, and works cleanly with React 18's concurrent rendering.

**@tanstack/react-virtual for the leads table.** The brief expects smooth scrolling at 5,000+ rows. Virtualization keeps the DOM at a constant ~20 rows while preserving full table semantics (we keep the header as a real grid that aligns with the rows, and use `role="table"/"row"/"cell"` on the virtualized children).

**date-fns, lucide-react, sonner, clsx + tailwind-merge.** Small, focused libraries: date formatting, icons, toast notifications, and class merging. No CSS-in-JS runtime, no UI mega-library.

---

## Project structure

```
src/
├── main.tsx              # entry: React Query + Router + Toaster
├── routes/router.tsx     # routing tree (deep links to /leads/:id, /leads/:id/edit, /leads/new)
├── pages/                # route-level components
│   ├── HomePage.tsx
│   ├── LeadsPage.tsx     # list + CRUD + bulk + dialogs orchestration
│   ├── BoardPage.tsx     # Kanban
│   └── NotFoundPage.tsx
├── components/
│   ├── layout/AppShell.tsx
│   ├── feedback/States.tsx       # Loading / Error / Empty
│   ├── ui/                       # shadcn primitives
│   ├── leads/                    # everything specific to a lead row/form
│   └── board/                    # Kanban column + card
├── hooks/
│   ├── useLeads.ts               # React Query hooks + mutations (optimistic)
│   ├── useUrlFilters.ts          # search/status/sort sync with URL
│   └── useDebouncedValue.ts
└── lib/
    ├── api.ts                    # fetch wrapper, typed endpoints, ApiError
    ├── status.ts                 # the state machine, intersection helper, color palette
    ├── types.ts                  # Lead, LeadStatus, bulk response types
    └── utils.ts                  # cn(), initials, avatar color seeding
```

---

## Design decisions

### How component, state, and async logic is organized

Three layers, kept distinct:

- **Server state** lives in React Query. The query key for the leads list is intentionally global (`["leads", "list"]`) — we fetch the full list once and filter/search/sort on the client. That keeps the cache trivial, makes search feel instant, and means mutations can patch a single source of truth.
- **URL state** (filters, search, sort) lives in `useSearchParams`. Two views (`/leads` and `/board`) read the same hook, so navigating between them preserves what the user is looking at without any extra plumbing.
- **Local UI state** (selected row IDs, which dialog is open) lives in `useState` inside the page component. This is the smallest scope it can live in without prop-drilling.

The page components (`LeadsPage`, `BoardPage`) are orchestrators: they own the dialog mode, wire the hooks together, and pass primitives to leaf components. Leaf components (`LeadsTable`, `KanbanCard`, `StatusBadge`, etc.) are presentational and reusable.

Async actions all go through React Query mutations defined in `useLeads.ts` — delete and status-transition are optimistic with rollback, create and update are non-optimistic (the server might reject for a validation reason, and an optimistic create would need to invent a UUID). Every async action surfaces a toast on success/failure and reports `isPending` so the UI can show busy state.

### How the status rules are enforced in the UI

The state machine is declared once, in `src/lib/status.ts`, and re-used everywhere:

- `nextStatusesFor(status)` powers the row-action menu, the lead-detail dialog, and the inline `StatusTransitionMenu` — only legal next statuses are rendered.
- `isTerminal(status)` powers the "Locked" badge on CONVERTED / LOST leads (in the table, the detail dialog, and the Kanban card). The corresponding rows don't even render a "Move to" button.
- `canTransition(from, to)` runs on every Kanban drop. Invalid drops surface a toast explaining the rule, and **no API call is made**. Valid drops fire `useTransitionLead`, which patches the cache optimistically and rolls back on failure.
- `intersectionOfNextStatuses(currents)` powers the bulk-status menu. Only transitions valid for **every** selected lead are offered. If any selected lead is terminal, the menu is disabled with a tooltip explaining why.

The mock server enforces the same rules server-side, which acts as a safety net. The UI never relies on it.

### What I'd do differently for offline support or concurrent edits

For **offline**: the React Query cache would back onto IndexedDB (via `persistQueryClient`), and mutations would queue in a local outbox until the network returns — replaying them with conflict resolution on reconnect. The optimistic patches already in place would carry the user across reconnections; we'd just need to add an "Unsynced" badge per row that's mutated but not yet acknowledged.

For **concurrent edits**: every lead would carry a `version` (or `updated_at` used as a strict ETag). PUT/PATCH would send `If-Match` and the server would reject 409 on stale writes. The UI would then re-fetch the lead, diff the user's pending edits against the new version, and show a small conflict-resolution affordance — keep mine / keep theirs / merge per-field. For status transitions specifically, the server already protects against impossible moves, so concurrent transitions either succeed once (first writer wins) or fail with a clear message that the local cache can use to roll back.

### What I'd improve given another week

- Per-lead activity timeline (calls, notes, status changes) and an audit log on the detail view.
- Saved views: name a filter combination and pin it to the sidebar.
- Keyboard navigation on the table (arrow keys to move row focus, `e` to edit, `del` to delete) and on the Kanban (move card with keyboard via `@dnd-kit`'s built-in keyboard sensor — currently the foundations are there, the bindings are not).
- Undo for delete and status changes — a 5-second sonner action toast that calls the inverse operation.
- A handful of integration tests (Vitest + Testing Library) covering: invalid transitions don't get rendered, optimistic delete rolls back on 500, bulk status uses the intersection of valid transitions.
- Pagination as a hybrid with virtualization: virtualize within a page, paginate at the server boundary, so the first paint is small even with a million leads.
- Tighten the design — the current look is clean but not distinctive; another pass on the avatar palette, status color contrast (especially LOST vs CONVERTED for color-blind users), and empty-state illustrations would help.

---

## AI usage note

I used Claude to scaffold boilerplate quickly: the Tailwind config, the shadcn primitives (which are themselves a copy-paste pattern), and the initial directory layout. I accepted those because they're well-trodden patterns where there's a "right answer" and rewriting them by hand wouldn't show anything interesting.

For the parts that matter — the state machine in `lib/status.ts`, the optimistic-update logic in `useLeads.ts`, the URL-state hook, the bulk-action intersection rule, the Kanban drop validation, and the virtualized table architecture — I wrote the design myself and used the model as a fast pair to type out the implementation. Every component-level decision (where to put state, what to debounce, what to optimistically patch, what to roll back, why bulk status uses the intersection) is mine and I can walk through any of them.

I rejected suggestions to: introduce a global Zustand store for filters (URL params are simpler and shareable), use `react-beautiful-dnd` (unmaintained), do per-query React Query keys for each filter combination (it would shred the cache and make optimistic updates more painful), and add a backend-driven pagination layer (overkill given the brief and the in-memory mock).

---

## Submission checklist

- [x] Source code with clear structure
- [x] README with tech stack, setup, design decisions, AI usage note
- [x] `.gitignore` (no `node_modules`, `.env`, or build outputs)
- [x] TypeScript throughout
- [x] All three levels implemented
- [ ] Screen recording — see the demo Loom link in the submission email
