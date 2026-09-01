# Polaris Conversion Team

> 25-agent team converting CodFlow dashboard to Shopify Polaris patterns.
> Each agent reads this file to understand its role and protocol.

## How to Use This System

1. **Read `POLARIS_PLAN.md`** — know the current phase and progress
2. **Read this file** — know your role and protocol
3. **Read `phases/phase-X.md`** — know the detailed task requirements
4. **Find the first `pending` task** in the current phase
5. **Do the work** — implement the task
6. **Verify** — run `npm run typecheck && npm test`
7. **Update `POLARIS_PLAN.md`** — mark task `completed`, add to Progress Log
8. **Repeat** — find the next `pending` task

---

## Agent Roles (25 agents)

### Role: `builder-components` (5 agents)

**Expertise:** Reusable UI components (shadcn/ui style)
**Reads:** `POLARIS_PLAN.md`, `phases/phase-0.md`
**Builds:** `components/ui/*.tsx`
**Can work in:** Phase 0 only
**Skills:** React component architecture, Tailwind CSS, shadcn/ui patterns

### Role: `builder-forms` (8 agents)

**Expertise:** CRUD form pages, form state management
**Reads:** `POLARIS_PLAN.md`, current `phases/phase-X.md`
**Builds:** `components/*/*-form*.tsx`, `components/*/*-form-page.tsx`
**Can work in:** Phases 2, 3, 4, 5
**Skills:** Form state (useState), Zod validation, server actions, two-column layouts

### Role: `builder-index` (5 agents)

**Expertise:** List/table pages, IndexTable pattern
**Reads:** `POLARIS_PLAN.md`, current `phases/phase-X.md`
**Builds:** `components/*/*-view.tsx` (list pages), table components
**Can work in:** Phase 1
**Skills:** Data tables, filtering, pagination, bulk actions, tabs

### Role: `builder-detail` (4 agents)

**Expertise:** Detail/profile views, read-only layouts
**Reads:** `POLARIS_PLAN.md`, current `phases/phase-X.md`
**Builds:** `components/*/*-detail-view.tsx`, `components/*/*-profile-view.tsx`
**Can work in:** Phase 6
**Skills:** Read-only layouts, status badges, action dropdowns, two-column info display

### Role: `tester` (2 agents)

**Expertise:** Quality assurance, TypeScript verification
**Reads:** `POLARIS_PLAN.md`
**Runs:** `npm run typecheck`, `npm test`
**Reports:** Pass/fail status in Progress Log
**Can work in:** Any phase (verification pass)

### Role: `reviewer` (1 agent)

**Expertise:** Code quality, Polaris pattern compliance
**Reads:** `POLARIS_PLAN.md`, `docs/design/DESIGN.dashboard.md`
**Checks:** RTL support, i18n, spacing, colors, component patterns
**Can work in:** Any phase (review pass)

---

## Task Assignment Protocol

### Starting a New Session

```bash
# 1. Read the master plan
cat POLARIS_PLAN.md

# 2. Identify current phase (first non-COMPLETED phase)
# 3. Find first "pending" task in that phase

# 4. Mark it in_progress with your agent name
# Edit POLARIS_PLAN.md:
#   | 0A | Create ContextualSaveBar | in_progress | builder-components-1 | ... |

# 5. Read the phase file for detailed instructions
cat phases/phase-0.md

# 6. Implement the task (edit the target files)

# 7. Run verification
npm run typecheck
npm test

# 8. Mark task completed
# Edit POLARIS_PLAN.md:
#   | 0A | Create ContextualSaveBar | completed | builder-components-1 | ... |

# 9. Add entry to Progress Log
# | 2026-08-29T10:00:00Z | builder-components-1 | 0A | completed | components/ui/contextual-save-bar.tsx |

# 10. Move to next task (or next phase if all done)
```

### Completing a Task

Update `POLARIS_PLAN.md`:
1. Change `pending` → `completed` in the task row
2. Add your agent name in the Agent column
3. Add entry to Progress Log table

### When All Tasks in a Phase Are Complete

Change the phase status from `[PENDING]` to `[COMPLETED]`:
```
## Phase 0: Shared Components `[COMPLETED]`
```

---

## Parallelism Rules

| Phase | Max Parallel Agents | Reason |
|-------|---------------------|--------|
| 0 | 1 | Components must exist before use |
| 1 | 5 | Independent index pages |
| 2 | 1 | Single file (product form) |
| 3 | 3 | Independent form files |
| 4 | 3 | Independent form files |
| 5 | 3 | Independent form files |
| 6 | 4 | Independent detail views |
| 7 | 1 | Config changes |

**No two agents modify the same file simultaneously.**

---

## File Safety Rules

- Each agent modifies ONLY its assigned files
- Read before writing (check current file state)
- Preserve all existing functionality
- Preserve RTL support (`ps-*`/`pe-*` logical properties)
- Preserve i18n (locale keys, translation hooks)
- No new production dependencies
- No hardcoded user-facing strings
- Run `npm run typecheck` after every change

---

## Design References

- `docs/design/DESIGN.dashboard.md` — Polaris color tokens, typography, spacing
- `docs/design/SHOPIFY_MATCH_CHECKLIST.md` — Acceptance checklist
- `components/themes/builder-ui.tsx:147` — SiteBuilderSaveBar (existing save bar pattern)
- `components/ui/form-section.tsx` — Current FormSection component
- `components/ui/card.tsx` — Current Card component
- `hooks/` — Existing hooks directory for useUnsavedChanges

---

## Escalation Protocol

If an agent encounters a blocker:
1. Mark the task as `blocked` in POLARIS_PLAN.md
2. Add a note explaining the blocker in the Progress Log
3. Move to the next available `pending` task
4. The orchestrator will resolve the blocker in the next session
