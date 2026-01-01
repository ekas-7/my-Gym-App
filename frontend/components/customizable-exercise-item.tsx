'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Edit2, Save, X } from "lucide-react";

interface CustomizableExerciseItemProps {
  name: string;
  defaultReps: string;
  defaultSets: number;
  defaultWeight?: number;
  isCompleted?: boolean;
  onAdd: (sets: number, reps: string, weight: number) => void;
}

export function CustomizableExerciseItem({ 
  name, 
  defaultReps, 
  defaultSets, 
  defaultWeight = 0,
  isCompleted,
  onAdd 
}: CustomizableExerciseItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [sets, setSets] = useState(defaultSets);
  const [reps, setReps] = useState(defaultReps);
  const [weight, setWeight] = useState(defaultWeight);

  const handleSave = () => {
    onAdd(sets, reps, weight);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSets(defaultSets);
    setReps(defaultReps);
    setWeight(defaultWeight);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
        <div className="font-semibold text-sm">{name}</div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Sets</label>
            <input
              type="number"
              min="1"
              max="10"
              value={sets}
              onChange={(e) => setSets(parseInt(e.target.value) || 1)}
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Reps</label>
            <input
              type="text"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="8-12"
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Weight (kg)</label>
            <input
              type="number"
              min="0"
              step="2.5"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} className="flex-1">
            <Save className="h-3 w-3 mr-1" />
            Save & Add
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => onAdd(defaultSets, defaultReps, defaultWeight)}
        variant={isCompleted ? "default" : "outline"}
        className="h-auto py-3 px-4 flex items-center justify-between flex-1"
      >
        <div className="flex flex-col items-start gap-1">
          <span className="font-semibold text-sm">{name}</span>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>{defaultSets} sets</span>
            <span>•</span>
            <span>{defaultReps} reps</span>
            {defaultWeight > 0 && (
              <>
                <span>•</span>
                <span>{defaultWeight}kg</span>
              </>
            )}
          </div>
        </div>
        {isCompleted && (
          <Badge variant="secondary" className="ml-2">
            <Check className="h-3 w-3" />
          </Badge>
        )}
      </Button>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="h-auto py-3 px-3"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
