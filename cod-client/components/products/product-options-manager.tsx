"use client";

import { useState } from "react";
import { Plus, Trash2, X, Pencil, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useProducts, useCommon } from "@/lib/translations";
import { useLanguage } from "@/lib/i18n-context";
import { useConfirm } from "@/components/ui/use-confirm";
import type { VariantOptionFormState, VariantOptionValueFormState } from "@/types";

interface Props {
  options: VariantOptionFormState[];
  onChange: (options: VariantOptionFormState[]) => void;
  disabled?: boolean;
}

type DisplayMode = "color-circle" | "color-frame" | "color-text" | "text";

function makeId() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function ProductOptionsManager({ options, onChange, disabled = false }: Props) {
  const t = useProducts();
  const common = useCommon();
  const { dir } = useLanguage();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const [editing, setEditing] = useState<{ optionId: string; valueId: string } | null>(null);
  const [editingName, setEditingName] = useState("");

  const presets: { name: string; displayMode: DisplayMode }[] = [
    { name: t.form.option_preset_color, displayMode: "color-circle" },
    { name: t.form.option_preset_size, displayMode: "text" },
    { name: t.form.option_preset_length, displayMode: "text" },
    { name: t.form.option_preset_material, displayMode: "text" },
  ];

  function addOption(name: string, displayMode: DisplayMode) {
    onChange([...options, { id: makeId(), name, displayMode, values: [] }]);
  }

  async function removeOption(optionId: string) {
    const ok = await confirmDialog({
      title: t.form.delete_option_confirm,
      variant: "destructive",
      confirmLabel: common.delete,
    });
    if (!ok) return;
    onChange(options.filter((o) => o.id !== optionId));
  }

  function updateOptionName(optionId: string, val: string) {
    onChange(options.map((o) => (o.id === optionId ? { ...o, name: val } : o)));
  }

  function setDisplayMode(optionId: string, mode: DisplayMode) {
    onChange(options.map((o) => (o.id === optionId ? { ...o, displayMode: mode } : o)));
  }

  function addValue(optionId: string, asColor = false) {
    onChange(
      options.map((o) =>
        o.id === optionId
          ? { ...o, values: [...o.values, { id: makeId(), value: "", hexColor: asColor ? "#cccccc" : "" }] }
          : o
      )
    );
  }

  function updateValue(optionId: string, valueId: string, field: keyof VariantOptionValueFormState, val: string) {
    onChange(
      options.map((o) =>
        o.id === optionId
          ? { ...o, values: o.values.map((v) => (v.id === valueId ? { ...v, [field]: val } : v)) }
          : o
      )
    );
  }

  function removeValue(optionId: string, valueId: string) {
    onChange(
      options.map((o) =>
        o.id === optionId ? { ...o, values: o.values.filter((v) => v.id !== valueId) } : o
      )
    );
  }

  function startEdit(optionId: string, val: VariantOptionValueFormState) {
    setEditing({ optionId, valueId: val.id });
    setEditingName(val.value);
  }

  function commitEdit(optionId: string, valueId: string) {
    const val = editingName.trim();
    if (val) updateValue(optionId, valueId, "value", val);
    setEditing(null);
  }

  function renderValue(option: VariantOptionFormState, val: VariantOptionValueFormState) {
    const isEditingThis = editing?.optionId === option.id && editing?.valueId === val.id;
    const hasColor = !!val.hexColor && val.hexColor !== "" && option.displayMode !== "text";

    if (isEditingThis) {
      return (
        <div key={val.id} className="flex items-center gap-1 rounded-md border border-primary bg-background px-1 py-0.5">
          <Input
            autoFocus
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={() => commitEdit(option.id, val.id)}
            onKeyDown={(e) => { if (e.key === "Enter") { commitEdit(option.id, val.id); } if (e.key === "Escape") setEditing(null); }}
            className="h-7 w-24 border-0 p-0 px-1 text-xs bg-transparent focus-visible:ring-0"
            dir={dir}
          />
          {hasColor && (
            <input
              type="color"
              value={val.hexColor}
              onChange={(e) => updateValue(option.id, val.id, "hexColor", e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
            />
          )}
        </div>
      );
    }

    if (hasColor && option.displayMode === "color-circle") {
      return (
        <div
          key={val.id}
          className="group relative flex flex-col items-center gap-1"
          title={val.value}
        >
          <button
            type="button"
            onClick={() => !disabled && startEdit(option.id, val)}
            className="w-9 h-9 rounded-full border-2 border-border shadow-sm relative overflow-hidden transition-transform group-hover:scale-105"
            style={{ background: val.hexColor }}
          >
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/40 transition-colors" />
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 px-1 text-center leading-tight">
              {val.value}
            </span>
          </button>
          <span className="text-[10px] text-muted-foreground max-w-[60px] truncate">{val.value}</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => removeValue(option.id, val.id)}
              className="absolute -top-1.5 -end-1.5 hidden group-hover:flex w-4 h-4 rounded-full bg-destructive text-white items-center justify-center shadow"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      );
    }

    if (hasColor && option.displayMode === "color-frame") {
      return (
        <div
          key={val.id}
          className="group relative"
          title={val.value}
        >
          <button
            type="button"
            onClick={() => !disabled && startEdit(option.id, val)}
            className="h-9 min-w-11 rounded-lg border-2 flex items-center justify-center px-1.5 shadow-sm transition-transform group-hover:scale-105"
            style={{ borderColor: val.hexColor, background: `${val.hexColor}1f` }}
          >
            <span className="text-[11px] font-medium truncate px-0.5">{val.value}</span>
          </button>
          {!disabled && (
            <button
              type="button"
              onClick={() => removeValue(option.id, val.id)}
              className="absolute -top-1.5 -end-1.5 hidden group-hover:flex w-4 h-4 rounded-full bg-destructive text-white items-center justify-center shadow"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      );
    }

    return (
      <span
        key={val.id}
        className="group relative inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium"
        onClick={() => !disabled && startEdit(option.id, val)}
      >
        <Pencil className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary" />
        {val.value}
        {!disabled && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeValue(option.id, val.id); }}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      {!disabled && (
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm font-bold text-foreground">{t.form.options_label}</Label>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="outline" size="sm">
                  <Plus className="w-3.5 h-3.5 me-1" />
                  {t.form.add_option}
                  <ChevronDown className="w-3.5 h-3.5 ms-1" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t.form.option_preset_label}</DropdownMenuLabel>
              {presets.map((p) => (
                <DropdownMenuItem
                  key={p.name}
                  onClick={() => addOption(p.name, p.displayMode)}
                >
                  {p.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => addOption("", "text")}>
                <Plus className="w-4 h-4" />
                {t.form.option_add_custom}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {options.map((option) => (
        <div key={option.id} className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <Input
              value={option.name}
              onChange={(e) => updateOptionName(option.id, e.target.value)}
              placeholder={t.form.option_name_placeholder}
              className="flex-1 text-sm"
              disabled={disabled}
              dir={dir}
            />
            {option.displayMode !== "text" && !disabled && (
              <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5" title={t.form.option_display_mode}>
                <Button
                  type="button"
                  variant={option.displayMode === "color-circle" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => setDisplayMode(option.id, "color-circle")}
                >
                  {t.form.option_display_color_circle}
                </Button>
                <Button
                  type="button"
                  variant={option.displayMode === "color-frame" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => setDisplayMode(option.id, "color-frame")}
                >
                  {t.form.option_display_color_frame}
                </Button>
                <Button
                  type="button"
                  variant={option.displayMode === "color-text" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => setDisplayMode(option.id, "color-text")}
                >
                  {t.form.option_display_color_text}
                </Button>
              </div>
            )}
            {!disabled && (
              <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(option.id)} className="shrink-0 text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {option.values.map((val) => renderValue(option, val))}

            {!disabled && !editing && (
              <div className="flex items-center gap-1.5">
                <Button type="button" variant="ghost" size="sm" onClick={() => addValue(option.id, false)} className="h-8 text-xs">
                  <Plus className="w-3 h-3 me-1" />{t.form.add_option_value}
                </Button>
                {option.displayMode !== "text" && (
                  <button
                    type="button"
                    onClick={() => addValue(option.id, true)}
                    className="h-7 w-7 rounded-full border-2 border-dashed border-border/70 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center text-xs transition-colors"
                    title={t.form.add_option_value}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      {ConfirmDialog}
    </div>
  );
}
