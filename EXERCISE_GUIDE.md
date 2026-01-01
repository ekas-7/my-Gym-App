# Exercise Data Guide

## How to Add New Exercises

All exercise data is centralized in `frontend/lib/exercises.ts` for easy management.

### Adding Cardio Exercises

Edit the `cardioExercises` array:

```typescript
export const cardioExercises: CardioExercise[] = [
  { id: 'running', name: 'Running', duration: 30 },
  // Add your new cardio exercise:
  { id: 'hiking', name: 'Hiking', duration: 45 },
];
```

### Adding Weight Training Exercises

#### For Chest Exercises:
```typescript
export const chestExercises: Exercise[] = [
  { id: 'bench-press', name: 'Bench Press', reps: '8-12', sets: 4 },
  // Add new chest exercise:
  { id: 'decline-press', name: 'Decline Press', reps: '10-12', sets: 3 },
];
```

#### For Back Exercises:
```typescript
export const backExercises: Exercise[] = [
  { id: 'deadlift', name: 'Deadlift', reps: '6-10', sets: 4 },
  // Add new back exercise:
  { id: 'chin-ups', name: 'Chin-ups', reps: '8-10', sets: 3 },
];
```

#### For Shoulder Exercises:
```typescript
export const shoulderExercises: Exercise[] = [
  { id: 'overhead-press', name: 'Overhead Press', reps: '8-12', sets: 4 },
  // Add new shoulder exercise:
  { id: 'shrugs', name: 'Barbell Shrugs', reps: '12-15', sets: 4 },
];
```

### Adding New Muscle Groups

1. **Add exercise array**:
```typescript
export const legsExercises: Exercise[] = [
  { id: 'squat', name: 'Barbell Squat', reps: '8-12', sets: 4 },
  { id: 'leg-press', name: 'Leg Press', reps: '10-15', sets: 4 },
  // ... more exercises
];
```

2. **Update MuscleGroup type**:
```typescript
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'legs';
```

3. **Add to weightTrainingCategories**:
```typescript
export const weightTrainingCategories: ExerciseCategory[] = [
  // ... existing categories
  {
    id: 'legs',
    name: 'Leg Day',
    exercises: legsExercises,
    icon: '🦵',
  },
];
```

4. **Update page.tsx state**:
```typescript
const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<'chest' | 'back' | 'shoulders' | 'legs'>('chest');
```

## Exercise Data Types

### CardioExercise
```typescript
{
  id: string;          // Unique identifier (lowercase, hyphenated)
  name: string;        // Display name
  duration: number;    // Default duration in minutes
}
```

### Exercise (Weight Training)
```typescript
{
  id: string;          // Unique identifier (lowercase, hyphenated)
  name: string;        // Display name
  reps: string;        // Rep range (e.g., '8-12')
  sets: number;        // Number of sets
}
```

### ExerciseCategory
```typescript
{
  id: MuscleGroup;             // 'chest' | 'back' | 'shoulders'
  name: string;                // Display name (e.g., 'Chest Day')
  exercises: Exercise[];       // Array of exercises
  icon: string;                // Emoji icon
}
```

## Best Practices

### Naming Conventions
- **IDs**: Use lowercase with hyphens (e.g., `barbell-row`)
- **Names**: Use proper capitalization (e.g., `Barbell Row`)
- **Rep Ranges**: Use format `'min-max'` (e.g., `'8-12'`)

### Exercise Organization
- **Compound movements first**: Place heavy compound exercises first
- **Isolation exercises last**: Finish with isolation movements
- **Logical progression**: Order exercises by importance

### Icons
Choose appropriate emojis:
- 💪 Chest/Upper body
- 🔥 Back/Core
- 🏋️ Shoulders/Arms
- 🦵 Legs
- ❤️ Cardio
- 🎯 Sports/Activities

## Example: Adding a Complete Muscle Group

```typescript
// 1. Create exercise array
export const armsExercises: Exercise[] = [
  // Biceps
  { id: 'barbell-curl', name: 'Barbell Curl', reps: '8-12', sets: 3 },
  { id: 'hammer-curl', name: 'Hammer Curl', reps: '10-12', sets: 3 },
  { id: 'preacher-curl', name: 'Preacher Curl', reps: '10-12', sets: 3 },
  
  // Triceps
  { id: 'close-grip-bench', name: 'Close Grip Bench', reps: '8-12', sets: 3 },
  { id: 'tricep-dips', name: 'Tricep Dips', reps: '10-15', sets: 3 },
  { id: 'overhead-extension', name: 'Overhead Extension', reps: '10-12', sets: 3 },
];

// 2. Update type
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms';

// 3. Add to categories
export const weightTrainingCategories: ExerciseCategory[] = [
  // ... existing
  {
    id: 'arms',
    name: 'Arm Day',
    exercises: armsExercises,
    icon: '💪',
  },
];
```

## Time Calculation

- **Cardio**: Uses exact duration from exercise data
- **Weight Training**: Calculates as `sets × 2 minutes`
  - Example: 4 sets = 8 minutes (allows time for rest between sets)

You can modify this calculation in `page.tsx`:
```typescript
addExercise(exercise.sets * 2);  // Change the multiplier as needed
```

## Quick Reference

| Task | File to Edit | What to Change |
|------|--------------|----------------|
| Add cardio exercise | `lib/exercises.ts` | Add to `cardioExercises` array |
| Add chest exercise | `lib/exercises.ts` | Add to `chestExercises` array |
| Add back exercise | `lib/exercises.ts` | Add to `backExercises` array |
| Add shoulder exercise | `lib/exercises.ts` | Add to `shoulderExercises` array |
| Add new muscle group | `lib/exercises.ts` + `app/page.tsx` | Create array, update type, add category |
| Change time calculation | `app/page.tsx` | Modify `addExercise()` call |
| Change exercise UI | `components/exercise-item.tsx` or `components/cardio-item.tsx` | Edit component |

---

**Pro Tip**: After editing `lib/exercises.ts`, the changes appear immediately in the UI - no need to modify components!
