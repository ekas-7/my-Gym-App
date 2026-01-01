'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Sparkles, Dumbbell, Heart, Timer, Zap } from 'lucide-react';
import { IExercise } from '@/models/Exercise';

interface ExerciseHistoryProps {
  exercises: IExercise[];
  onDelete: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  cardio: 'bg-red-100 text-red-800 border-red-200',
  'weight-training': 'bg-blue-100 text-blue-800 border-blue-200',
};

const categoryIcons: Record<string, React.ReactNode> = {
  cardio: <Heart className="h-3 w-3" />,
  'weight-training': <Dumbbell className="h-3 w-3" />,
};

const muscleGroupEmoji: Record<string, string> = {
  chest: '💪',
  back: '🦾',
  shoulders: '🏋️',
  legs: '🦵',
  arms: '💪',
  core: '🎯',
  'full-body': '🔥',
};

export function ExerciseHistory({ exercises, onDelete }: ExerciseHistoryProps) {
  if (exercises.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No exercises logged yet. Add your first exercise using the AI analyzer above!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span>Today's Exercises</span>
          <Badge variant="outline">{exercises.length} total</Badge>
        </h3>

        <div className="space-y-3">
          {exercises.map((exercise) => (
            <Card key={exercise._id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge className={categoryColors[exercise.category]}>
                      {categoryIcons[exercise.category]}
                      <span className="ml-1 capitalize">{exercise.category === 'weight-training' ? 'Weight Training' : 'Cardio'}</span>
                    </Badge>
                    
                    {exercise.muscleGroup && (
                      <Badge variant="outline" className="text-xs">
                        {muscleGroupEmoji[exercise.muscleGroup]} <span className="capitalize">{exercise.muscleGroup}</span>
                      </Badge>
                    )}
                    
                    {exercise.isAIAnalyzed && (
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                        <Sparkles className="h-3 w-3 mr-1 fill-purple-500" />
                        AI
                      </Badge>
                    )}
                    
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(exercise.createdAt || exercise.date).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  <p className="text-base font-semibold mb-3">{exercise.name}</p>

                  {/* Exercise Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
                    {/* Weight Training Details */}
                    {exercise.category === 'weight-training' && exercise.sets.length > 0 && (
                      <>
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-md border border-blue-100 dark:border-blue-900">
                          <div className="text-muted-foreground mb-0.5">Sets</div>
                          <div className="font-bold text-blue-700 dark:text-blue-400 text-base">{exercise.sets.length}</div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-950/30 p-2.5 rounded-md border border-purple-100 dark:border-purple-900">
                          <div className="text-muted-foreground mb-0.5">Reps</div>
                          <div className="font-bold text-purple-700 dark:text-purple-400 text-base">
                            {exercise.sets[0].reps}
                            {exercise.sets.length > 1 && exercise.sets.every(s => s.reps === exercise.sets[0].reps) 
                              ? '' 
                              : ` (avg)`}
                          </div>
                        </div>
                        {exercise.sets[0].weight > 0 && (
                          <div className="bg-green-50 dark:bg-green-950/30 p-2.5 rounded-md border border-green-100 dark:border-green-900">
                            <div className="text-muted-foreground mb-0.5">Weight</div>
                            <div className="font-bold text-green-700 dark:text-green-400 text-base">{exercise.sets[0].weight} kg</div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Cardio Details */}
                    {exercise.category === 'cardio' && (
                      <>
                        {exercise.duration && (
                          <div className="bg-red-50 dark:bg-red-950/30 p-2.5 rounded-md border border-red-100 dark:border-red-900">
                            <div className="text-muted-foreground flex items-center gap-1 mb-0.5">
                              <Timer className="h-3 w-3" />
                              Duration
                            </div>
                            <div className="font-bold text-red-700 dark:text-red-400 text-base">{exercise.duration} min</div>
                          </div>
                        )}
                        {exercise.distance && (
                          <div className="bg-orange-50 dark:bg-orange-950/30 p-2.5 rounded-md border border-orange-100 dark:border-orange-900">
                            <div className="text-muted-foreground mb-0.5">Distance</div>
                            <div className="font-bold text-orange-700 dark:text-orange-400 text-base">{exercise.distance} km</div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Calories Burned */}
                    {exercise.caloriesBurned && (
                      <div className="bg-yellow-50 dark:bg-yellow-950/30 p-2.5 rounded-md border border-yellow-100 dark:border-yellow-900">
                        <div className="text-muted-foreground flex items-center gap-1 mb-0.5">
                          <Zap className="h-3 w-3" />
                          Calories
                        </div>
                        <div className="font-bold text-yellow-700 dark:text-yellow-400 text-base">{exercise.caloriesBurned}</div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {exercise.notes && (
                    <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-md border border-gray-200 dark:border-gray-800">
                      💡 {exercise.notes}
                    </div>
                  )}

                  {/* Original Description for AI-analyzed exercises */}
                  {exercise.isAIAnalyzed && exercise.description && (
                    <div className="text-xs text-muted-foreground italic bg-purple-50/50 dark:bg-purple-950/20 p-2 rounded-md border border-purple-100 dark:border-purple-900">
                      "{exercise.description}"
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => exercise._id && onDelete(exercise._id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-900">
        <div className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Dumbbell className="h-4 w-4" />
          Today's Summary
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Total Exercises</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{exercises.length}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Total Calories Burned</div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {exercises.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0)} <span className="text-sm">kcal</span>
            </div>
          </div>
          {exercises.some(ex => ex.duration) && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Total Duration</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0)} <span className="text-sm">min</span>
              </div>
            </div>
          )}
          {exercises.filter(ex => ex.category === 'weight-training').length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Weight Training</div>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                {exercises.filter(ex => ex.category === 'weight-training').length} <span className="text-sm">exercises</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
