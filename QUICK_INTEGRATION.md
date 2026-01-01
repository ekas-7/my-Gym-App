# 🚀 Quick Integration Guide - 5 Minutes

## Step 1: Add Imports to `app/page.tsx`

Add these imports at the top:

```typescript
import { ExerciseForm, ExerciseHistory } from '@/components/exercise-form';
import { MealHistory, MealTypeSelect } from '@/components/meal-history';
import { IExercise } from '@/models/Exercise';
import { IMeal } from '@/models/Meal';
import { Plus } from 'lucide-react';
```

## Step 2: Add State Variables

Add after existing state declarations (around line 70):

```typescript
// Exercise & Meal tracking
const [exercises, setExercises] = useState<IExercise[]>([]);
const [meals, setMeals] = useState<IMeal[]>([]);
const [showExerciseForm, setShowExerciseForm] = useState(false);
const [mealType, setMealType] = useState<string>('other');
```

## Step 3: Add Fetch Functions

Add these functions before the `return` statement:

```typescript
// Fetch today's exercises
const fetchExercises = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`/api/exercises?date=${today}`);
    const result = await response.json();
    if (result.success) setExercises(result.data);
  } catch (error) {
    console.error('Error fetching exercises:', error);
  }
};

// Fetch today's meals
const fetchMeals = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`/api/meals?date=${today}&getTotals=true`);
    const result = await response.json();
    if (result.success) {
      setMeals(result.data);
      if (result.totals) {
        setCalories(result.totals.totalCalories);
        setCarbs(result.totals.totalCarbs);
        setFats(result.totals.totalFats);
        setProtein(result.totals.totalProtein);
      }
    }
  } catch (error) {
    console.error('Error fetching meals:', error);
  }
};

// Save exercise
const handleSaveExercise = async (exerciseData: Partial<IExercise>) => {
  try {
    const response = await fetch('/api/exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exerciseData),
    });
    const result = await response.json();
    if (result.success) {
      setExercises([result.data, ...exercises]);
      setShowExerciseForm(false);
      const minutesPerSet = 2;
      const totalMinutes = result.data.sets.length * minutesPerSet;
      setExerciseMinutes(exerciseMinutes + totalMinutes);
      updateFitnessData({ exerciseMinutes: exerciseMinutes + totalMinutes });
    }
  } catch (error) {
    console.error('Error saving exercise:', error);
  }
};

// Delete exercise
const handleDeleteExercise = async (id: string) => {
  try {
    const response = await fetch(`/api/exercises?id=${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (result.success) setExercises(exercises.filter(ex => ex._id !== id));
  } catch (error) {
    console.error('Error deleting exercise:', error);
  }
};

// Delete meal
const handleDeleteMeal = async (id: string) => {
  try {
    const response = await fetch(`/api/meals?id=${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (result.success) fetchMeals();
  } catch (error) {
    console.error('Error deleting meal:', error);
  }
};
```

## Step 4: Update `analyzeFood()` Function

Replace the existing `analyzeFood()` function with this version that saves to meals:

```typescript
const analyzeFood = async () => {
  if (!foodDescription.trim()) return;
  
  setIsAnalyzing(true);
  setAnalysisError('');

  try {
    const response = await fetch('/api/diet/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodDescription }),
    });

    const result = await response.json();

    if (result.success) {
      const { calories: cal, carbs: c, fats: f, protein: p } = result.data;

      // Save to meals collection
      const mealResponse = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: foodDescription,
          mealType: mealType,
          calories: cal,
          carbs: c,
          fats: f,
          protein: p,
          isAIAnalyzed: true,
          date: new Date(),
          timestamp: new Date(),
        }),
      });

      const mealResult = await mealResponse.json();
      if (mealResult.success) {
        const newCalories = calories + cal;
        const newCarbs = carbs + c;
        const newFats = fats + f;
        const newProtein = protein + p;

        setCalories(newCalories);
        setCarbs(newCarbs);
        setFats(newFats);
        setProtein(newProtein);

        updateFitnessData({ 
          calories: newCalories,
          carbs: newCarbs,
          fats: newFats,
          protein: newProtein
        });

        fetchMeals();
        setFoodDescription('');
      }
    } else {
      setAnalysisError(result.error || 'Failed to analyze food');
    }
  } catch (error) {
    setAnalysisError('An error occurred while analyzing the food');
    console.error('Error:', error);
  } finally {
    setIsAnalyzing(false);
  }
};
```

## Step 5: Update useEffect

Find the useEffect that calls `fetchTodayData()` and add:

```typescript
useEffect(() => {
  fetchTodayData();
  fetchExercises();  // ADD THIS
  fetchMeals();       // ADD THIS
}, []);
```

## Step 6: Update Diet Tab

Find the Diet tab and add meal type selector before the AI input:

```typescript
{/* Meal Type Selector - ADD THIS */}
<div className="space-y-2">
  <label className="text-sm font-medium">Meal Type</label>
  <MealTypeSelect value={mealType} onChange={setMealType} />
</div>
```

Then add meal history after the macro distribution card:

```typescript
{/* Meal History - ADD THIS */}
<div className="border-t pt-4">
  <MealHistory meals={meals} onDelete={handleDeleteMeal} />
</div>
```

## Step 7: Update Exercise Tab

Replace the entire Exercise tab content with:

```typescript
<TabsContent value="exercise" className="space-y-4">
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-purple-500" />
            Exercise Tracking
          </CardTitle>
          <CardDescription>Log custom exercises with sets and weight</CardDescription>
        </div>
        <Badge variant={exerciseMinutes >= exerciseGoal ? "default" : "secondary"}>
          {exerciseMinutes} / {exerciseGoal} min
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{Math.round((exerciseMinutes / exerciseGoal) * 100)}%</span>
        </div>
        <Progress value={(exerciseMinutes / exerciseGoal) * 100} className="h-3" />
      </div>

      {!showExerciseForm && (
        <Button onClick={() => setShowExerciseForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Log New Exercise
        </Button>
      )}

      {showExerciseForm && (
        <ExerciseForm
          onSave={handleSaveExercise}
          onCancel={() => setShowExerciseForm(false)}
          muscleGroups={['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'full-body']}
        />
      )}

      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold mb-3">Today's Workout</h3>
        <ExerciseHistory exercises={exercises} onDelete={handleDeleteExercise} />
      </div>
    </CardContent>
  </Card>
</TabsContent>
```

## ✅ Done!

Restart your dev server and test:

1. **Exercise Tab**: Click "Log New Exercise" → Fill form → Save
2. **Diet Tab**: Select meal type → Enter food → Add Food → See in history
3. **Streak Tab**: Check consistent green/amber/gray colors

## 🐛 Troubleshooting

**Exercises not saving?**
- Check MongoDB connection
- Check browser console for errors
- Verify `/api/exercises` returns 201 status

**Meals not showing?**
- Ensure Gemini API key is set
- Check `/api/meals` response
- Verify date format matches

**Theme still inconsistent?**
- Hard refresh browser (Cmd+Shift+R on Mac)
- Clear browser cache
- Restart dev server

## 📚 Need More Help?

See `EXERCISE_MEAL_TRACKING_GUIDE.md` for detailed explanations.
