'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconSparkle, IconSunrise, IconSun, IconMoon, IconCoffee, IconUtensils } from '@/components/icons';
import { SwipeToDelete } from '@/components/swipe-to-delete';
import { IMeal } from '@/models/Meal';

interface MealHistoryProps {
  meals: IMeal[];
  onDelete: (id: string) => void;
}

const mealTypeColors: Record<string, string> = {
  breakfast: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
  lunch:     'bg-green-100  text-green-800  border-green-200  dark:bg-green-950/40  dark:text-green-300  dark:border-green-800',
  dinner:    'bg-blue-100   text-blue-800   border-blue-200   dark:bg-blue-950/40   dark:text-blue-300   dark:border-blue-800',
  snack:     'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  other:     'bg-gray-100   text-gray-800   border-gray-200   dark:bg-gray-800/60   dark:text-gray-300   dark:border-gray-600',
};

const MealTypeIcon: Record<string, React.ReactNode> = {
  breakfast: <IconSunrise size={12} />,
  lunch:     <IconSun     size={12} />,
  dinner:    <IconMoon    size={12} />,
  snack:     <IconCoffee  size={12} />,
  other:     <IconUtensils size={12} />,
};

export function MealHistory({ meals, onDelete }: MealHistoryProps) {
  if (meals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No meals logged yet. Add your first meal using the AI analyzer above!
      </div>
    );
  }

  // Group meals by type
  const mealsByType = meals.reduce((acc, meal) => {
    const type = meal.mealType || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(meal);
    return acc;
  }, {} as Record<string, IMeal[]>);

  return (
    <div className="space-y-4">
      {/* All Meals */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span>Today's Meals</span>
          <Badge variant="outline">{meals.length} total</Badge>
        </h3>

        <div className="space-y-2">
          {meals.map((meal) => (
            <SwipeToDelete
              key={meal.id}
              onDelete={() => meal.id && onDelete(meal.id)}
              deleteLabel={`Delete ${meal.mealType} meal`}
            >
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`flex items-center gap-1 ${mealTypeColors[meal.mealType]}`}>
                    {MealTypeIcon[meal.mealType]}
                    <span className="capitalize">{meal.mealType}</span>
                  </Badge>
                  {meal.isAIAnalyzed && (
                    <Badge variant="outline" className="text-xs">
                      <IconSparkle size={12} className="mr-1" />
                      AI
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(meal.timestamp).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                
                <p className="text-sm font-medium mb-2">{meal.description}</p>

                {/* Macros Grid */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-red-50 dark:bg-red-950/30 p-2 rounded">
                    <div className="text-muted-foreground">Cal</div>
                    <div className="font-bold text-red-700 dark:text-red-400">{meal.calories}</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
                    <div className="text-muted-foreground">Carbs</div>
                    <div className="font-bold text-blue-700 dark:text-blue-400">{meal.carbs.toFixed(0)}g</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded">
                    <div className="text-muted-foreground">Fat</div>
                    <div className="font-bold text-yellow-700 dark:text-yellow-400">{meal.fats.toFixed(0)}g</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded">
                    <div className="text-muted-foreground">Prot</div>
                    <div className="font-bold text-purple-700 dark:text-purple-400">{meal.protein.toFixed(0)}g</div>
                  </div>
                </div>

                {meal.notes && (
                  <div className="mt-2 text-xs text-muted-foreground italic">
                    {meal.notes}
                  </div>
                )}
              </Card>
            </SwipeToDelete>
          ))}
        </div>
      </div>

      {/* Breakdown by Meal Type */}
      {Object.keys(mealsByType).length > 1 && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-3">Breakdown by Meal Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(mealsByType).map(([type, typeMeals]) => {
              const totalCalories = typeMeals.reduce((sum: number, meal: any) => sum + meal.calories, 0);
              const totalProtein = typeMeals.reduce((sum: number, meal: any) => sum + meal.protein, 0);

              return (
                <Card key={type} className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-muted-foreground">{MealTypeIcon[type]}</span>
                    <div className="text-sm font-medium capitalize">{type}</div>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Meals:</span>
                      <span className="font-semibold">{typeMeals.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calories:</span>
                      <span className="font-semibold">{totalCalories}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Protein:</span>
                      <span className="font-semibold">{totalProtein.toFixed(1)}g</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
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
      {mealTypes.map((type) => (
        <Button
          key={type}
          size="sm"
          variant={value === type ? 'default' : 'outline'}
          onClick={() => onChange(type)}
          className="capitalize flex items-center gap-1.5"
        >
          {MealTypeIcon[type]}
          {type}
        </Button>
      ))}
    </div>
  );
}
