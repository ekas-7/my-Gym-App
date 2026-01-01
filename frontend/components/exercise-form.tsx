'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Check, X, Trash2 } from 'lucide-react';
import { IExercise, ISet } from '@/models/Exercise';

interface ExerciseFormProps {
  onSave: (exercise: Partial<IExercise>) => void;
  onCancel: () => void;
  initialData?: Partial<IExercise>;
  muscleGroups: Array<'chest' | 'back' | 'shoulders' | 'legs' | 'arms' | 'core' | 'full-body'>;
}

export function ExerciseForm({ onSave, onCancel, initialData, muscleGroups }: ExerciseFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [muscleGroup, setMuscleGroup] = useState<string>(initialData?.muscleGroup || muscleGroups[0]);
  const [sets, setSets] = useState<ISet[]>(initialData?.sets || [{ setNumber: 1, weight: 0, reps: 0, completed: true }]);
  const [notes, setNotes] = useState(initialData?.notes || '');

  const addSet = () => {
    setSets([...sets, { setNumber: sets.length + 1, weight: 0, reps: 0, completed: true }]);
  };

  const removeSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index).map((set, i) => ({ ...set, setNumber: i + 1 })));
  };

  const updateSet = (index: number, field: 'weight' | 'reps', value: number) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    setSets(newSets);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      category: 'weight-training',
      muscleGroup: muscleGroup as any,
      sets,
      notes: notes.trim(),
      date: new Date(),
    });
  };

  const totalVolume = sets.reduce((total, set) => total + (set.weight * set.reps), 0);

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Exercise Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Bench Press"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Muscle Group</label>
        <select
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {muscleGroups.map((group) => (
            <option key={group} value={group}>
              {group.charAt(0).toUpperCase() + group.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Sets</label>
          <Button size="sm" variant="outline" onClick={addSet}>
            <Plus className="h-4 w-4 mr-1" />
            Add Set
          </Button>
        </div>

        <div className="space-y-2">
          {sets.map((set, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
              <span className="text-sm font-medium w-8">#{set.setNumber}</span>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    value={set.weight}
                    onChange={(e) => updateSet(index, 'weight', parseFloat(e.target.value) || 0)}
                    placeholder="Weight (kg)"
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    step="0.5"
                    min="0"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={set.reps}
                    onChange={(e) => updateSet(index, 'reps', parseInt(e.target.value) || 0)}
                    placeholder="Reps"
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    min="0"
                  />
                </div>
              </div>
              {sets.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeSet(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="text-sm text-muted-foreground">
          Total Volume: <span className="font-semibold">{totalVolume.toFixed(1)} kg</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel? Any adjustments needed?"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={2}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} className="flex-1" disabled={!name.trim()}>
          <Check className="h-4 w-4 mr-2" />
          Save Exercise
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </Card>
  );
}

interface ExerciseHistoryProps {
  exercises: IExercise[];
  onDelete: (id: string) => void;
}

export function ExerciseHistory({ exercises, onDelete }: ExerciseHistoryProps) {
  if (exercises.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No exercises logged yet. Add your first exercise above!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {exercises.map((exercise) => {
        const totalVolume = exercise.sets.reduce((total: number, set: ISet) => total + (set.weight * set.reps), 0);
        const totalReps = exercise.sets.reduce((total: number, set: ISet) => total + set.reps, 0);

        return (
          <Card key={exercise._id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold">{exercise.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {exercise.muscleGroup}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(exercise.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => exercise._id && onDelete(exercise._id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm mb-2">
              <div>
                <div className="text-muted-foreground">Sets</div>
                <div className="font-semibold">{exercise.sets.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Reps</div>
                <div className="font-semibold">{totalReps}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Volume</div>
                <div className="font-semibold">{totalVolume.toFixed(0)} kg</div>
              </div>
            </div>

            <div className="space-y-1">
              {exercise.sets.map((set: ISet, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded">
                  <span className="font-medium w-12">Set {set.setNumber}</span>
                  <span className="text-muted-foreground">{set.weight}kg × {set.reps} reps</span>
                </div>
              ))}
            </div>

            {exercise.notes && (
              <div className="mt-2 text-xs text-muted-foreground italic">
                Note: {exercise.notes}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
