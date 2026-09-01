# Phase 0: Shared Components

**Status:** PENDING
**Depends on:** Nothing
**Blocks:** All other phases
**Max Parallel Agents:** 1 (sequential)

---

## Overview

Build the foundational UI components that all subsequent phases depend on.
These components implement Shopify Polaris patterns for:
- Contextual save bar (unsaved changes indicator)
- Page header with breadcrumbs and actions
- Consistent form section layout
- Dirty state tracking

---

## 0A. ContextualSaveBar

**File:** `components/ui/contextual-save-bar.tsx`
**Agent Role:** builder-components
**Dependencies:** None

### Interface

```typescript
interface ContextualSaveBarProps {
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => Promise<void>;
  onDiscard: () => void;
}
```

### Requirements

1. **Position:** Fixed top of viewport, z-index 50, full width
2. **Height:** 48px
3. **Background:** `#ffffff` (white card)
4. **Border:** 1px bottom hairline `#e1e3e5`
5. **Shadow:** Level 2 elevation (`0 1px 3px rgba(0,0,0,0.12), 0 0 0 1px var(--border)`)
6. **Visibility:** Renders only when `hasChanges` is true
7. **Animation:** Slides down from top (240ms ease, cubic-bezier(0.2,0,0.4,1))

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  You have unsaved changes          [Discard] [Save]     │
└─────────────────────────────────────────────────────────┘
```

- **Left:** Text "You have unsaved changes" — 13px, `#616161` (ink-secondary)
- **Right:** Two buttons:
  - Discard: secondary variant (white bg, border, ink text)
  - Save: primary variant (ink bg, white text)
- **Mobile:** Full width, buttons may shrink or stack
- **RTL:** Text right-aligned, buttons left-aligned

### Behavior

- `hasChanges=true`: Bar slides down into view
- `hasChanges=false`: Bar slides up and unmounts
- `isSaving=true`: Save button shows spinner, both buttons disabled
- Discard button calls `onDiscard` on click
- Save button calls `onSave` on click

### Implementation Notes

- Use `useEffect` to control animation state
- Use `createPortal` to render at document body level (optional, for z-index safety)
- Use existing Button component from `components/ui/button.tsx`
- Follow Polaris motion: 240ms, `cubic-bezier(0.2,0,0.4,1)`
- Respect `prefers-reduced-motion`

### Reference

- `components/themes/builder-ui.tsx:147` — SiteBuilderSaveBar (existing pattern)
- Polaris ContextualSaveBar component

### Verification

- [ ] Renders at top of page when hasChanges=true
- [ ] Hidden when hasChanges=false
- [ ] Save button triggers onSave callback
- [ ] Discard button triggers onDiscard callback
- [ ] Shows loading state when isSaving=true
- [ ] Animation works (slide down/up)
- [ ] Works in RTL (buttons flip sides)
- [ ] Passes `npm run typecheck`

---

## 0B. PageHeader

**File:** `components/ui/page-header.tsx`
**Agent Role:** builder-components
**Dependencies:** None

### Interface

```typescript
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary';
    loading?: boolean;
    disabled?: boolean;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    destructive?: boolean;
  }>;
  moreActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    destructive?: boolean;
  }>;
}
```

### Requirements

1. **Breadcrumb row** (if breadcrumbs provided):
   - 12px font, `#616161` (ink-secondary)
   - Separator: chevron-right (LTR) / chevron-left (RTL)
   - Last item: plain text (current page), others: links
   - Spacing: mb-2 (8px below breadcrumbs)

2. **Title row:**
   - Title: 20px, weight 700, `#202223` (ink)
   - Subtitle: 14px, weight 400, `#616161` (ink-secondary), below title
   - Actions: right-aligned (LTR), left-aligned (RTL)
   - Spacing: py-5 (20px vertical)

3. **Border:** 1px bottom hairline `#e1e3e5`

4. **More actions button:**
   - Icon: `MoreHorizontal` from lucide-react
   - Renders as `DropdownMenu` (from `components/ui/dropdown-menu.tsx`)
   - Each item: label + optional icon + destructive variant

### Layout

```
Products > Electronics > New Product
─────────────────────────────────────────────────────
Edit Product                    [Delete ▾] [Save]
─────────────────────────────────────────────────────
```

### Implementation Notes

- Use existing `Button` from `components/ui/button.tsx`
- Use existing `DropdownMenu` from `components/ui/dropdown-menu.tsx`
- Use lucide-react icons: `ChevronRight`, `ChevronLeft`, `MoreHorizontal`
- Use logical properties: `ps-*`/`pe-*` instead of `pl-*`/`pr-*`
- RTL: breadcrumbs flip, actions move to left

### Reference

- Polaris Page component
- Current back button in `components/products/product-form-page.tsx:405-413`

### Verification

- [ ] Renders title correctly
- [ ] Subtitle renders when provided
- [ ] Breadcrumbs render with links and separators
- [ ] Primary action renders as button
- [ ] More actions renders as dropdown menu
- [ ] RTL layout flips correctly
- [ ] Passes `npm run typecheck`

---

## 0C. Update FormSection + FormField

**File:** `components/ui/form-section.tsx`
**Agent Role:** builder-components
**Dependencies:** None

### Current State

```typescript
// Current FormSection
function FormSection({ title, icon, children, className }) { ... }

// Current FormField
function FormField({ label, children, className }) { ... }
```

### Changes Required

1. **Add `subtitle` prop to FormSection:**
   ```typescript
   interface FormSectionProps {
     title: string;
     subtitle?: string;  // NEW
     icon?: React.ReactNode;
     children: React.ReactNode;
     className?: string;
   }
   ```

2. **Render subtitle** below title in header area:
   ```tsx
   <div className="flex items-center gap-3 px-6 py-4 border-b border-border/60 bg-muted/20">
     {icon && (
       <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
         <div className="text-muted-foreground">{icon}</div>
       </div>
     )}
     <div>
       <h2 className="text-base font-semibold text-foreground">{title}</h2>
       {subtitle && (
         <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
       )}
     </div>
   </div>
   ```

3. **Update FormField label** from `font-semibold` to `font-medium`:
   ```tsx
   // Before
   <Label className="text-sm font-semibold text-foreground ms-1">{label}</Label>
   
   // After
   <Label className="text-sm font-medium text-foreground ms-1">{label}</Label>
   ```

### Backward Compatibility

- All existing usages of FormSection/FormField must continue to work
- subtitle is optional — no breaking changes
- Font weight change is visual only — no layout breakage

### Verification

- [ ] Existing forms still render correctly
- [ ] Subtitle renders when provided
- [ ] Subtitle hidden when not provided
- [ ] FormField label uses font-medium
- [ ] Passes `npm run typecheck`

---

## 0D. useUnsavedChanges Hook

**File:** `hooks/use-unsaved-changes.ts`
**Agent Role:** builder-components
**Dependencies:** None

### Interface

```typescript
function useUnsavedChanges(): {
  isDirty: boolean;
  markDirty: () => void;
  resetDirty: () => void;
}
```

### Requirements

1. **Dirty tracking:**
   - `isDirty` starts as `false`
   - `markDirty()` sets `isDirty` to `true`
   - `resetDirty()` sets `isDirty` to `false`

2. **beforeunload protection:**
   - When `isDirty` is true, add `beforeunload` event listener
   - Listener shows browser's native "leave page?" dialog
   - When `isDirty` becomes false, remove the listener

3. **Cleanup:**
   - Remove listener on component unmount
   - Use `useEffect` for listener management

### Implementation

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";

export function useUnsavedChanges() {
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const resetDirty = useCallback(() => setIsDirty(false), []);

  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return { isDirty, markDirty, resetDirty };
}
```

### Usage in Forms

```typescript
const { isDirty, markDirty, resetDirty } = useUnsavedChanges();

// In every onChange handler:
function handleNameChange(value: string) {
  setName(value);
  markDirty();
}

// After successful save:
async function handleSave() {
  // ... save logic ...
  resetDirty();
}
```

### Reference

- `components/themes/site-builder-state.ts` — existing dirty tracking pattern

### Verification

- [ ] `isDirty` starts as false
- [ ] `markDirty()` sets isDirty to true
- [ ] `resetDirty()` sets isDirty to false
- [ ] `beforeunload` fires when isDirty=true
- [ ] No `beforeunload` when isDirty=false
- [ ] Cleanup on unmount
- [ ] Passes `npm run typecheck`
