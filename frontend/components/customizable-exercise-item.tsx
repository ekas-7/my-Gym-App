'use client';

import { useState } from "react";
import { IconCheck, IconEdit, IconSave, IconX } from "@/components/icons";

interface Props {
  name: string;
  defaultReps: string;
  defaultSets: number;
  defaultWeight?: number;
  isCompleted?: boolean;
  onAdd: (sets: number, reps: string, weight: number) => void;
}

export function CustomizableExerciseItem({ name, defaultReps, defaultSets, defaultWeight = 0, isCompleted, onAdd }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [sets,   setSets]   = useState(defaultSets);
  const [reps,   setReps]   = useState(defaultReps);
  const [weight, setWeight] = useState(defaultWeight);

  const handleSave   = () => { onAdd(sets, reps, weight); setIsEditing(false); };
  const handleCancel = () => { setSets(defaultSets); setReps(defaultReps); setWeight(defaultWeight); setIsEditing(false); };

  if (isEditing) {
    return (
      <div className="p-4 space-y-3">
        <p className="font-headline text-sm" style={{ color: "var(--foreground)" }}>{name}</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Sets",       value: sets,   onChange: (v: string) => setSets(parseInt(v) || 1),   type: "number", step: "1",   min: "1" },
            { label: "Reps",       value: reps,   onChange: (v: string) => setReps(v),                  type: "text",   step: "",    min: ""  },
            { label: "Weight (kg)",value: weight, onChange: (v: string) => setWeight(parseFloat(v) || 0), type: "number", step: "2.5", min: "0" },
          ].map(({ label, value, onChange, type, step, min }) => (
            <div key={label} className="space-y-1">
              <label className="font-label text-[11px] uppercase tracking-widest text-muted-foreground">{label}</label>
              <input
                type={type} inputMode={type === "number" ? "decimal" : undefined}
                step={step || undefined} min={min || undefined}
                value={value || ""}
                onChange={e => onChange(e.target.value)}
                className="w-full rounded-xl px-2 py-2 text-sm outline-none bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)]"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={handleSave}
            className="flex-1 h-10 rounded-xl font-headline text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            style={{ background: "var(--chart-3)", color: "#1a0800" }}>
            <IconSave size={14} /> Save & Log
          </button>
          <button onClick={handleCancel}
            className="h-10 px-4 rounded-xl font-headline text-sm flex items-center justify-center active:scale-95 transition-all border"
            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
            <IconX size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <button
        onClick={() => onAdd(defaultSets, defaultReps, defaultWeight)}
        className="flex-1 flex items-center justify-between gap-3 text-left active:opacity-70 transition-opacity"
      >
        <div>
          <p className="font-headline text-sm" style={{ color: "var(--foreground)" }}>{name}</p>
          <p className="font-label text-xs mt-0.5 text-muted-foreground">
            {defaultSets} sets · {defaultReps} reps{defaultWeight > 0 ? ` · ${defaultWeight}kg` : ""}
          </p>
        </div>
        {isCompleted && (
          <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: "var(--chart-3)", color: "#1a0800" }}>
            <IconCheck size={13} />
          </span>
        )}
      </button>

      <button onClick={() => setIsEditing(true)}
        aria-label={`Edit ${name}`}
        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all"
        style={{ color: "var(--muted-foreground)" }}>
        <IconEdit size={16} />
      </button>
    </div>
  );
}
