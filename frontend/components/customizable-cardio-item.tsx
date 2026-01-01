'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Edit2, Save, X } from "lucide-react";

interface CustomizableCardioItemProps {
  name: string;
  defaultDuration: number;
  defaultDistance?: number;
  isCompleted?: boolean;
  onAdd: (duration: number, distance?: number) => void;
}

export function CustomizableCardioItem({ 
  name, 
  defaultDuration, 
  defaultDistance,
  isCompleted,
  onAdd 
}: CustomizableCardioItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [duration, setDuration] = useState(defaultDuration);
  const [distance, setDistance] = useState(defaultDistance || 0);
  const [includeDistance, setIncludeDistance] = useState(!!defaultDistance);

  const handleSave = () => {
    onAdd(duration, includeDistance ? distance : undefined);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDuration(defaultDuration);
    setDistance(defaultDistance || 0);
    setIncludeDistance(!!defaultDistance);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
        <div className="font-semibold text-sm">{name}</div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Duration (min)</label>
            <input
              type="number"
              min="1"
              max="300"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Distance (km)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={distance}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setDistance(val);
                setIncludeDistance(val > 0);
              }}
              placeholder="Optional"
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            id={`include-distance-${name}`}
            checked={includeDistance}
            onChange={(e) => setIncludeDistance(e.target.checked)}
            className="rounded"
          />
          <label htmlFor={`include-distance-${name}`}>Track distance</label>
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
        onClick={() => onAdd(defaultDuration, defaultDistance)}
        variant={isCompleted ? "default" : "outline"}
        className="h-auto py-3 px-4 flex items-center justify-between flex-1"
      >
        <div className="flex flex-col items-start gap-1">
          <span className="font-semibold text-sm">{name}</span>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>{defaultDuration} min</span>
            {defaultDistance && (
              <>
                <span>•</span>
                <span>{defaultDistance} km</span>
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
