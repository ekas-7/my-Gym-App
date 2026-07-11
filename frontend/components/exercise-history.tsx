'use client';

import React from 'react';
import { IconSparkle, IconDumbbell, IconHeart, IconTimer, IconZap, IconRun, IconShield, IconTarget, IconFlame } from '@/components/icons';
import { SwipeToDelete } from '@/components/swipe-to-delete';
import { IExercise } from '@/lib/types';

interface ExerciseHistoryProps {
  exercises: IExercise[];
  onDelete: (id: string) => void;
}

const MuscleIcon: Record<string, React.ReactNode> = {
  chest:       <IconHeart    size={11} />,
  back:        <IconShield   size={11} />,
  shoulders:   <IconZap      size={11} />,
  biceps:      <IconDumbbell size={11} />,
  triceps:     <IconTarget   size={11} />,
  abs:         <IconTarget   size={11} />,
  legs:        <IconRun      size={11} />,
  arms:        <IconDumbbell size={11} />,
  core:        <IconTarget   size={11} />,
  'full-body': <IconFlame    size={11} />,
};

/* Small labelled metric tile */
function Metric({ label, value, unit, color }: { label: string; value: React.ReactNode; unit?: string; color: string }) {
  return (
    <div className="rounded-lg p-2.5" style={{ background: 'var(--input)', border: '1px solid var(--border)' }}>
      <div className="font-label text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
      <div className="font-display text-base mt-0.5" style={{ color }}>{value}{unit ? <span className="text-[11px] font-headline"> {unit}</span> : null}</div>
    </div>
  );
}

export function ExerciseHistory({ exercises, onDelete }: ExerciseHistoryProps) {
  if (exercises.length === 0) {
    return (
      <div className="text-center py-6 font-body text-sm" style={{ color: 'var(--muted-foreground)' }}>
        No exercises logged yet.
      </div>
    );
  }

  const totalBurned = exercises.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0);

  return (
    <div className="space-y-3">
      <div className="space-y-2.5">
        {exercises.map((exercise) => {
          const isWeights = exercise.category === 'weight-training';
          const catColor = isWeights ? 'var(--chart-3)' : 'var(--chart-1)';
          return (
            <SwipeToDelete
              key={exercise.id}
              onDelete={() => exercise.id && onDelete(exercise.id)}
              deleteLabel={`Delete ${exercise.name}`}
            >
              <div className="rounded-xl p-3.5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {/* category chip */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-label text-[10px] uppercase tracking-wider"
                    style={{ background: `color-mix(in srgb, ${catColor} 12%, transparent)`, color: catColor }}>
                    {isWeights ? <IconDumbbell size={11} /> : <IconRun size={11} />}
                    {isWeights ? 'Weights' : 'Cardio'}
                  </span>

                  {exercise.muscleGroup && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-label text-[10px] uppercase tracking-wider"
                      style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                      {MuscleIcon[exercise.muscleGroup]}<span className="capitalize">{exercise.muscleGroup}</span>
                    </span>
                  )}

                  {exercise.isAIAnalyzed && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-label text-[10px] uppercase tracking-wider"
                      style={{ background: 'color-mix(in srgb, var(--chart-1) 12%, transparent)', color: 'var(--chart-1)' }}>
                      <IconSparkle size={11} />AI
                    </span>
                  )}

                  <span className="font-label text-[10px] ml-auto" style={{ color: 'var(--muted-foreground)' }}>
                    {new Date(exercise.createdAt || exercise.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="font-headline text-sm mb-2.5" style={{ color: 'var(--foreground)' }}>{exercise.name}</p>

                <div className="grid grid-cols-3 gap-2">
                  {isWeights && exercise.sets.length > 0 && (
                    <>
                      <Metric label="Sets" value={exercise.sets.length} color="var(--chart-1)" />
                      <Metric label="Reps" value={exercise.sets[0].reps} color="var(--chart-2)" />
                      {exercise.sets[0].weight > 0 && <Metric label="Weight" value={exercise.sets[0].weight} unit="kg" color="var(--chart-3)" />}
                    </>
                  )}
                  {exercise.category === 'cardio' && (
                    <>
                      {exercise.duration ? <Metric label="Duration" value={exercise.duration} unit="min" color="var(--chart-1)" /> : null}
                      {exercise.distance ? <Metric label="Distance" value={exercise.distance} unit="km" color="var(--chart-3)" /> : null}
                    </>
                  )}
                  {exercise.caloriesBurned ? <Metric label="Burned" value={exercise.caloriesBurned} unit="kcal" color="var(--chart-2)" /> : null}
                </div>

                {exercise.notes && (
                  <div className="mt-2.5 font-body text-xs rounded-lg p-2.5" style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                    {exercise.notes}
                  </div>
                )}
              </div>
            </SwipeToDelete>
          );
        })}
      </div>

      {/* Summary */}
      <div className="rounded-xl p-3.5 flex items-center justify-around" style={{ background: 'var(--input)', border: '1px solid var(--border)' }}>
        <div className="text-center">
          <div className="font-label text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Exercises</div>
          <div className="font-display text-xl" style={{ color: 'var(--chart-1)' }}>{exercises.length}</div>
        </div>
        <div className="w-px h-8" style={{ background: 'var(--border)' }} />
        <div className="text-center">
          <div className="font-label text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Burned</div>
          <div className="font-display text-xl" style={{ color: 'var(--chart-2)' }}>{totalBurned}<span className="text-[11px] font-headline"> kcal</span></div>
        </div>
      </div>
    </div>
  );
}
