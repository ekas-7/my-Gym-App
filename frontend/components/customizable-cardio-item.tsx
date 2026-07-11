'use client';

import { useState } from "react";
import { IconCheck, IconEdit, IconSave, IconX } from "@/components/icons";

interface Props {
  name: string;
  defaultDuration: number;
  defaultDistance?: number;
  isCompleted?: boolean;
  onAdd: (duration: number, distance?: number) => void;
}

export function CustomizableCardioItem({ name, defaultDuration, defaultDistance, isCompleted, onAdd }: Props) {
  const [isEditing, setIsEditing]       = useState(false);
  const [duration,  setDuration]        = useState(defaultDuration);
  const [distance,  setDistance]        = useState(defaultDistance ?? 0);
  const [trackDist, setTrackDist]       = useState(!!defaultDistance);

  const handleSave = () => { onAdd(duration, trackDist ? distance : undefined); setIsEditing(false); };
  const handleCancel = () => { setDuration(defaultDuration); setDistance(defaultDistance ?? 0); setTrackDist(!!defaultDistance); setIsEditing(false); };

  if (isEditing) {
    return (
      <div className="p-4 space-y-3">
        <p className="font-headline text-sm" style={{ color: "var(--foreground)" }}>{name}</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Duration (min)", value: duration, onChange: (v: number) => setDuration(v), step: 1, min: 1 },
            { label: "Distance (km)",  value: distance, onChange: (v: number) => { setDistance(v); setTrackDist(v > 0); }, step: 0.5, min: 0 },
          ].map(({ label, value, onChange, step, min }) => (
            <div key={label} className="space-y-1">
              <label className="font-label text-[11px] uppercase tracking-widest text-muted-foreground">{label}</label>
              <input
                type="number" inputMode="decimal"
                min={min} step={step} value={value || ""}
                onChange={e => onChange(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)]"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={handleSave}
            className="flex-1 h-10 rounded-xl font-headline text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            style={{ background: "var(--chart-1)", color: "#001f24" }}>
            <IconSave size={14} /> Save & Log
          </button>
          <button onClick={handleCancel}
            className="h-10 px-4 rounded-xl font-headline text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all border"
            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
            <IconX size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      {/* Tap the row to log; consistent row height */}
      <button
        onClick={() => onAdd(defaultDuration, defaultDistance)}
        className="flex-1 flex items-center justify-between gap-3 text-left active:opacity-70 transition-opacity"
      >
        <div>
          <p className="font-headline text-sm" style={{ color: "var(--foreground)" }}>{name}</p>
          <p className="font-label text-xs mt-0.5 text-muted-foreground">
            {defaultDuration} min{defaultDistance ? ` · ${defaultDistance} km` : ""}
          </p>
        </div>
        {isCompleted && (
          <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: "var(--chart-2)", color: "#102000" }}>
            <IconCheck size={13} />
          </span>
        )}
      </button>

      {/* Edit button */}
      <button onClick={() => setIsEditing(true)}
        aria-label={`Edit ${name}`}
        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all"
        style={{ color: "var(--muted-foreground)", background: "transparent" }}>
        <IconEdit size={16} />
      </button>
    </div>
  );
}
