'use client';

import React from 'react';
import { IconSparkle, IconSunrise, IconSun, IconMoon, IconCoffee, IconUtensils } from '@/components/icons';
import { SwipeToDelete } from '@/components/swipe-to-delete';
import { IMeal } from '@/lib/types';

interface MealHistoryProps {
  meals: IMeal[];
  onDelete: (id: string) => void;
}

const MealTypeIcon: Record<string, React.ReactNode> = {
  breakfast: <IconSunrise size={12} />,
  lunch:     <IconSun     size={12} />,
  dinner:    <IconMoon    size={12} />,
  snack:     <IconCoffee  size={12} />,
  other:     <IconUtensils size={12} />,
};

const mealTypeColor: Record<string, string> = {
  breakfast: 'var(--chart-3)',
  lunch:     'var(--chart-2)',
  dinner:    'var(--chart-1)',
  snack:     'var(--chart-4)',
  other:     'var(--muted-foreground)',
};

function Macro({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="rounded-lg p-2" style={{ background: 'var(--input)', border: '1px solid var(--border)' }}>
      <div className="font-label text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
      <div className="font-display text-sm mt-0.5" style={{ color }}>{value}</div>
    </div>
  );
}

export function MealHistory({ meals, onDelete }: MealHistoryProps) {
  if (meals.length === 0) {
    return (
      <div className="text-center py-6 font-body text-sm" style={{ color: 'var(--muted-foreground)' }}>
        No meals logged yet.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {meals.map((meal) => {
        const color = mealTypeColor[meal.mealType] || 'var(--muted-foreground)';
        return (
          <SwipeToDelete
            key={meal.id}
            onDelete={() => meal.id && onDelete(meal.id)}
            deleteLabel={`Delete ${meal.mealType} meal`}
          >
            <div className="rounded-xl p-3.5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-label text-[10px] uppercase tracking-wider capitalize"
                  style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}>
                  {MealTypeIcon[meal.mealType]}{meal.mealType}
                </span>
                {meal.isAIAnalyzed && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-label text-[10px] uppercase tracking-wider"
                    style={{ background: 'color-mix(in srgb, var(--chart-1) 12%, transparent)', color: 'var(--chart-1)' }}>
                    <IconSparkle size={11} />AI
                  </span>
                )}
                <span className="font-label text-[10px] ml-auto" style={{ color: 'var(--muted-foreground)' }}>
                  {new Date(meal.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <p className="font-headline text-sm mb-2.5" style={{ color: 'var(--foreground)' }}>{meal.description}</p>

              <div className="grid grid-cols-4 gap-2">
                <Macro label="Cal"   value={meal.calories}             color="var(--chart-2)" />
                <Macro label="Carbs" value={`${meal.carbs.toFixed(0)}g`}   color="var(--chart-1)" />
                <Macro label="Fat"   value={`${meal.fats.toFixed(0)}g`}    color="var(--chart-3)" />
                <Macro label="Prot"  value={`${meal.protein.toFixed(0)}g`} color="var(--chart-4)" />
              </div>

              {meal.notes && (
                <div className="mt-2.5 font-body text-xs rounded-lg p-2.5" style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                  {meal.notes}
                </div>
              )}
            </div>
          </SwipeToDelete>
        );
      })}
    </div>
  );
}

interface MealTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function MealTypeSelect({ value, onChange }: MealTypeSelectProps) {
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'other'];

  return (
    <div className="flex flex-wrap gap-2">
      {mealTypes.map((type) => {
        const active = value === type;
        const color = mealTypeColor[type] || 'var(--muted-foreground)';
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            className="capitalize inline-flex items-center gap-1.5 px-3 h-9 rounded-xl font-headline text-xs active:scale-95 transition-all"
            style={{
              background: active ? color : 'var(--input)',
              border: `1px solid ${active ? color : 'var(--border)'}`,
              color: active ? '#0a0a0a' : 'var(--muted-foreground)',
            }}
          >
            {MealTypeIcon[type]}
            {type}
          </button>
        );
      })}
    </div>
  );
}
