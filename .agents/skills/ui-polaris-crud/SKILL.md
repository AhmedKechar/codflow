# UI Polaris CRUD — CodFlow Skill

> Reference for building and maintaining CRUD forms and detail views
> following Shopify Polaris patterns in the CodFlow merchant dashboard.

## Core Components

### PageHeader (`components/ui/page-header.tsx`)

```tsx
import { PageHeader } from "@/components/ui/page-header";

<PageHeader
  breadcrumbs={[
    { label: "Products", href: "/products" },
    { label: "Add Product" },
  ]}
  primaryAction={{
    label: "Save",
    onClick: async () => { await handleSave(); },
    loading: isPending,
    variant: "primary",
  }}
  secondaryActions={[{
    label: "Back",
    onClick: () => router.push("/products"),
    icon: <ArrowLeft className="w-4 h-4" />,
  }]}
  moreActions={[{
    label: "Delete",
    onClick: handleDelete,
    icon: <Trash2 className="w-4 h-4" />,
    destructive: true,
  }]}
/>
```

- `title` is optional — auto-derives from last breadcrumb
- `secondaryActions` for navigation (e.g., Back)
- `moreActions` for destructive actions (shown in dropdown)

### ContextualSaveBar (`components/ui/contextual-save-bar.tsx`)

```tsx
import { ContextualSaveBar } from "@/components/ui/contextual-save-bar";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

const { isDirty, markDirty, resetDirty } = useUnsavedChanges();

// Add markDirty() to every onChange handler
<input onChange={(e) => { setValue(e.target.value); markDirty(); }} />

// Show save bar when dirty
<ContextualSaveBar
  hasChanges={isDirty}
  isSaving={isPending}
  onSave={handleSave}
  onDiscard={() => router.push(backHref)}
/>

// Reset dirty after successful save
resetDirty();
```

### FormSection (`components/ui/form-section.tsx`)

```tsx
import { FormSection as Section, FormField as Field } from "@/components/ui/form-section";

<Section title="Personal Information" icon={<User size={18} />}>
  <Field label="Name *">
    <Input value={name} onChange={(e) => setName(e.target.value)} />
  </Field>
</Section>
```

- `title`, `subtitle`, `icon`, `children`, `className`
- `FormField`: `label`, `children`, `className`
- For error display, use local `Field` component with `error` prop

## Standard Form Pattern

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ContextualSaveBar } from "@/components/ui/contextual-save-bar";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { FormSection as Section, FormField as Field } from "@/components/ui/form-section";

export function MyForm({ data }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(data?.field ?? "");
  const { isDirty, markDirty, resetDirty } = useUnsavedChanges();

  function handleSave() {
    startTransition(async () => {
      try {
        await saveData(value);
        resetDirty();
        router.push("/list");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed");
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6 animate-fade-in">
      <PageHeader
        breadcrumbs={[
          { label: "Resource", href: "/list" },
          { label: "Edit Resource" },
        ]}
        primaryAction={{
          label: "Save",
          onClick: async () => { await handleSave(); },
          loading: isPending,
          variant: "primary",
        }}
        secondaryActions={[{
          label: "",
          onClick: () => router.push("/list"),
          icon: <ArrowLeft className="w-4 h-4" />,
        }]}
      />
      <ContextualSaveBar
        hasChanges={isDirty}
        isSaving={isPending}
        onSave={handleSave}
        onDiscard={() => router.push("/list")}
      />

      <div className="space-y-6">
        <Section title="Details" icon={<Package size={18} />}>
          <Field label="Name *">
            <Input
              value={value}
              onChange={(e) => { setValue(e.target.value); markDirty(); }}
            />
          </Field>
        </Section>
      </div>
    </div>
  );
}
```

## Standard Detail View Pattern

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Edit, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useConfirm } from "@/components/ui/use-confirm";

export function MyDetailView({ data }: Props) {
  const router = useRouter();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();

  async function handleDelete() {
    const ok = await confirmDialog({
      title: `Delete ${data.name}?`,
      variant: "destructive",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    await deleteItem(data.id);
    router.push("/list");
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in">
      <PageHeader
        breadcrumbs={[
          { label: "Resource", href: "/list" },
          { label: data.name },
        ]}
        secondaryActions={[{
          label: "Edit",
          onClick: () => router.push(`/list/${data.id}/edit`),
          icon: <Edit className="w-3.5 h-3.5" />,
        }]}
        moreActions={[{
          label: "Delete",
          onClick: handleDelete,
          icon: <Trash2 className="w-3.5 h-3.5" />,
          destructive: true,
        }]}
      />
      {/* Content */}
    </div>
  );
}
```

## Index Page Pattern

```tsx
"use client";

import { PageHeader } from "@/components/ui/page-header";

export function MyListView() {
  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in">
      <PageHeader
        breadcrumbs={[{ label: "Resources" }]}
        primaryAction={{
          label: "Add Resource",
          onClick: () => router.push("/resources/new"),
          variant: "primary",
        }}
      />
      {/* Table */}
    </div>
  );
}
```

## Key Rules

1. **Always use PageHeader** for breadcrumbs + actions (no manual back buttons)
2. **Always use ContextualSaveBar** for forms (replaces floating mobile save bar)
3. **Always use useUnsavedChanges** — call `markDirty()` on every onChange
4. **Always call resetDirty()** after successful save
5. **Never use `asChild`** on DropdownMenuTrigger — use `render={<Button />}`
6. **Use logical properties** (`ps-*`/`pe-*`) for RTL support
7. **No hardcoded strings** — use i18n translation keys
8. **Two-column layout** for complex forms: `grid-cols-[2fr,1fr]` main + sidebar
9. **Section icons** — use Lucide icons in FormSection header
10. **Error display** — use local Field component with `error` prop for form validation

## File References

| File | Purpose |
|------|---------|
| `components/ui/page-header.tsx` | Breadcrumbs + actions header |
| `components/ui/contextual-save-bar.tsx` | Sticky save/discard bar |
| `components/ui/form-section.tsx` | Section wrapper + field wrapper |
| `hooks/use-unsaved-changes.ts` | Dirty state tracking |
