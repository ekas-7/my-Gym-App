'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Sparkles } from 'lucide-react';
import { IMeal } from '@/models/Meal';

interface MealHistoryProps {
  meals: IMeal[];
  onDelete: (id: string) => void;
}

const mealTypeColors: Record<string, string> = {
  breakfast: 'bg-orange-100 text-orange-800 border-orange-200',
  lunch: 'bg-green-100 text-green-800 border-green-200',
  dinner: 'bg-blue-100 text-blue-800 border-blue-200',
  snack: 'bg-purple-100 text-purple-800 border-purple-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

const mealTypeIcons: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍪',
  other: '🍽️',
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
            <Card key={meal._id} className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={mealTypeColors[meal.mealType]}>
                      {mealTypeIcons[meal.mealType]} {meal.mealType}
                    </Badge>
                    {meal.isAIAnalyzed && (
                      <Badge variant="outline" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(meal.timestamp).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium mb-2">{meal.description}</p>

                  {/* Macros Grid */}
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="bg-red-50 p-2 rounded">
                      <div className="text-muted-foreground">Calories</div>
                      <div className="font-bold text-red-700">{meal.calories}</div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-muted-foreground">Carbs</div>
                      <div className="font-bold text-blue-700">{meal.carbs.toFixed(1)}g</div>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded">
                      <div className="text-muted-foreground">Fats</div>
                      <div className="font-bold text-yellow-700">{meal.fats.toFixed(1)}g</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <div className="text-muted-foreground">Protein</div>
                      <div className="font-bold text-purple-700">{meal.protein.toFixed(1)}g</div>
                    </div>
                  </div>

                  {meal.notes && (
                    <div className="mt-2 text-xs text-muted-foreground italic">
                      Note: {meal.notes}
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => meal._id && onDelete(meal._id)}
                  className="text-red-600 hover:text-red-700 ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
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
                    <span className="text-lg">{mealTypeIcons[type]}</span>
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
          className="capitalize"
        >
          <span className="mr-1">{mealTypeIcons[type]}</span>
          {type}
        </Button>
      ))}
    </div>
  );
}
