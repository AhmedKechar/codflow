"use client";

import { Palette } from "lucide-react";
import type { BorderRadius, ShadowIntensity } from "cod-shared/design-presets";
import { DESIGN_PRESETS } from "cod-shared/design-presets";

interface PresetPickerProps {
  borderRadius: BorderRadius;
  shadowIntensity: ShadowIntensity;
  onRadiusChange: (value: BorderRadius) => void;
  onShadowChange: (value: ShadowIntensity) => void;
}

export function PresetPicker({
  borderRadius,
  shadowIntensity,
  onRadiusChange,
  onShadowChange,
}: PresetPickerProps) {
  const handlePresetSelect = (preset: (typeof DESIGN_PRESETS)[number]) => {
    onRadiusChange(preset.borderRadius);
    onShadowChange(preset.shadowIntensity);
  };

  const isActive = (preset: (typeof DESIGN_PRESETS)[number]) =>
    borderRadius === preset.borderRadius && shadowIntensity === preset.shadowIntensity;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3 border-b border-border px-6 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Palette size={18} className="text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Design Style</h2>
          <p className="text-xs text-muted-foreground">Choose a preset or customize manually</p>
        </div>
      </div>
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {DESIGN_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className={[
                "relative flex flex-col items-center rounded-xl border-2 p-4 transition-all",
                "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive(preset)
                  ? "border-primary shadow-md"
                  : "border-border hover:border-muted-foreground/30",
              ].join(" ")}
            >
              <div
                className="mb-3 h-12 w-full rounded-lg"
                style={{ background: preset.preview.gradient }}
              />
              <span className="text-xs font-bold text-foreground">{preset.name}</span>
              <span className="mt-0.5 text-[10px] text-muted-foreground">{preset.nameAr}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Border Radius</span>
            <div className="flex gap-1.5">
              {(["rounded", "sharp", "minimal"] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => onRadiusChange(style)}
                  className={[
                    "px-2.5 py-1 text-[10px] font-semibold rounded-md border transition-all capitalize",
                    borderRadius === style
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/30",
                  ].join(" ")}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Shadow</span>
            <div className="flex gap-1.5">
              {(["soft", "medium", "strong"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => onShadowChange(level)}
                  className={[
                    "px-2.5 py-1 text-[10px] font-semibold rounded-md border transition-all capitalize",
                    shadowIntensity === level
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/30",
                  ].join(" ")}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
