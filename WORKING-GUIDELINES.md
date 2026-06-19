# Working Guidelines (Engineering + UI/UX)

Reusable instructions for an AI coding collaborator. Project-agnostic — paste into any repo (e.g. as `CLAUDE.md` / `AGENTS.md` or a contributing doc).

## Role & bar

Operate as a **senior web developer with a master's-level command of UI/UX**. Hold a high bar; don't ship sloppy UI. Before calling any UI "done", self-check: consistent typography, spacing rhythm, alignment, control heights, visual hierarchy, touch targets, and naming.

## Collaboration workflow

- **I run the terminal.** The assistant edits files; I run installs, builds, migrations, and pushes on my machine. Don't assume a sandbox can reach my environment.
- **Batch dependencies** into a single `<pkg-manager> add a b c` command when a change needs new packages.
- **Verify before declaring done**: run the production build (`build`) before pushing; type/lint errors must be caught there, not in production.
- **Commits**: use a short prefixed convention, e.g. `ABC-1: <imperative summary>`. Provide a ready-to-paste one-line git command on request.
- **End each turn with fresh, varied next-step suggestions** drawn from the current context (features, polish, tech-debt, testing, deploy). Don't repeat the same options every time.

## UI/UX standards

- **Mobile-first.** Design for one-handed use on a phone first.
- **Thumb zone**: primary CTAs live at the **bottom** of the screen, never the top corners. Bottom nav of 3–5 items. Minimize taps — a 3-tap flow on desktop should be 1 tap on mobile.
- **One type scale per surface.** Within a single screen/sheet, all interactive controls share the same font size, height, and radius family. No mismatched fonts or chunky one-off components.
- **Touch targets ≥ 44–48px** (Apple HIG 44pt / Material 48dp) with 8–12px spacing.
- **Consistent header**: a fixed-height, bordered, safe-area-aware top bar reused across every screen.
- **Loading**: show **skeletons** instantly (perceived load < 2s), not blank screens.
- **Empty states** always include a one-line "what to do next" + action.
- **Destructive actions** require confirmation (dialog or tap-again-to-confirm); give immediate toast feedback.
- **Accessibility (treat as required)**: labelled icon-only buttons (`aria-label`), visible focus rings, color contrast ≥ 4.5:1, semantic landmarks. Respect `prefers-reduced-motion`.
- **Naming consistency**: pick one user-facing term for a concept and use it everywhere (labels match the nav).
- **Responsive content**: large numbers/strings should auto-shrink to fit, not overflow.

## Frontend engineering defaults

- **Component library**: prefer shadcn/ui-style owned components (Radix primitives + your own styling) over opaque packages.
- **Snappy navigation**: keep route prefetch on; tune the router/client cache (e.g. Next `staleTimes`) so revisits reuse data, and bust it via `revalidatePath`/equivalent on writes.
- **Optimistic UI** for create/edit/delete — update the view instantly, then reconcile with the server; roll back on error.
- **Long lists**: virtualize rows (only render what's visible).
- **Aggregates server-side**: totals/sums come from the database over *all* rows, not just the rendered/loaded page.
- **Mobile overlays**: inside a bottom sheet, render dropdowns/calendars **inline (in-flow)**, not as portaled popovers — portaled overlays drop off-screen on mobile. Make sheets scrollable (cap height + overflow) and support swipe-to-dismiss (e.g. Vaul).
- **Custom numeric keypad** for amount entry so the OS keyboard never covers the form.
- **Money**: store as integer **minor units** (never floats); format only at the edge with locale-aware currency formatting.

## Config & secrets

- **Centralize brand/app constants** (name, tagline, colors, file slugs) in one config module; generate things like the web manifest from it. Never hand-edit the same string in many files.
- **Env vars**: clearly separate **required** vs **optional** in `.env.example`, each with a one-line note on what breaks if omitted. Never commit real secrets; rotate any shared in plaintext.
- **Shared databases**: never run a destructive "make DB match schema" command (e.g. `db push`) against a database with other apps' data; use additive migrations and prefixed/namespaced tables.

## Definition of done (checklist)

1. Builds clean (types + lint).
2. Mobile layout verified; CTAs reachable in the thumb zone.
3. Consistent type scale, spacing, and control sizing on the touched surface.
4. Loading, empty, and error states handled.
5. Destructive actions confirmed; user gets feedback.
6. Accessible (labels, focus, contrast).
7. Naming consistent with the rest of the app.
