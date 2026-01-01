export interface Exercise {
  id: string;
  name: string;
  reps: string;
  sets: number;
}

export interface CardioExercise {
  id: string;
  name: string;
  duration: number; // minutes
  distance?: number; // km (optional)
}

export const cardioExercises: CardioExercise[] = [
  { id: 'running', name: 'Running', duration: 30, distance: 5 },
  { id: 'cycling', name: 'Cycling', duration: 30, distance: 10 },
  { id: 'swimming', name: 'Swimming', duration: 20, distance: 1 },
  { id: 'jump-rope', name: 'Jump Rope', duration: 15 },
  { id: 'rowing', name: 'Rowing', duration: 20, distance: 3 },
  { id: 'elliptical', name: 'Elliptical', duration: 25 },
  { id: 'walking', name: 'Walking', duration: 45, distance: 5 },
  { id: 'hiking', name: 'Hiking', duration: 60, distance: 8 },
  { id: 'stair-climbing', name: 'Stair Climbing', duration: 20 },
  { id: 'sprints', name: 'Sprint Intervals', duration: 15, distance: 2 },
];

export const chestExercises: Exercise[] = [
  { id: 'bench-press', name: 'Bench Press', reps: '8-12', sets: 4 },
  { id: 'incline-press', name: 'Incline Bench Press', reps: '8-12', sets: 3 },
  { id: 'dumbbell-fly', name: 'Dumbbell Fly', reps: '10-15', sets: 3 },
  { id: 'cable-crossover', name: 'Cable Crossover', reps: '12-15', sets: 3 },
  { id: 'push-ups', name: 'Push-ups', reps: '15-20', sets: 3 },
  { id: 'dips', name: 'Chest Dips', reps: '10-15', sets: 3 },
];

export const backExercises: Exercise[] = [
  { id: 'deadlift', name: 'Deadlift', reps: '6-10', sets: 4 },
  { id: 'pull-ups', name: 'Pull-ups', reps: '8-12', sets: 4 },
  { id: 'barbell-row', name: 'Barbell Row', reps: '8-12', sets: 4 },
  { id: 'lat-pulldown', name: 'Lat Pulldown', reps: '10-12', sets: 3 },
  { id: 'cable-row', name: 'Seated Cable Row', reps: '10-12', sets: 3 },
  { id: 't-bar-row', name: 'T-Bar Row', reps: '8-12', sets: 3 },
];

export const shoulderExercises: Exercise[] = [
  { id: 'overhead-press', name: 'Overhead Press', reps: '8-12', sets: 4 },
  { id: 'lateral-raise', name: 'Lateral Raise', reps: '12-15', sets: 3 },
  { id: 'front-raise', name: 'Front Raise', reps: '12-15', sets: 3 },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', reps: '12-15', sets: 3 },
  { id: 'arnold-press', name: 'Arnold Press', reps: '10-12', sets: 3 },
  { id: 'face-pulls', name: 'Face Pulls', reps: '15-20', sets: 3 },
];

export const bicepsExercises: Exercise[] = [
  { id: 'barbell-curl', name: 'Barbell Curl', reps: '8-12', sets: 4 },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', reps: '10-12', sets: 3 },
  { id: 'hammer-curl', name: 'Hammer Curl', reps: '10-12', sets: 3 },
  { id: 'preacher-curl', name: 'Preacher Curl', reps: '10-15', sets: 3 },
  { id: 'concentration-curl', name: 'Concentration Curl', reps: '10-12', sets: 3 },
  { id: 'cable-curl', name: 'Cable Curl', reps: '12-15', sets: 3 },
];

export const tricepsExercises: Exercise[] = [
  { id: 'close-grip-bench', name: 'Close Grip Bench Press', reps: '8-12', sets: 4 },
  { id: 'tricep-dips', name: 'Tricep Dips', reps: '10-15', sets: 4 },
  { id: 'skull-crushers', name: 'Skull Crushers', reps: '10-12', sets: 3 },
  { id: 'overhead-extension', name: 'Overhead Extension', reps: '10-12', sets: 3 },
  { id: 'rope-pushdown', name: 'Rope Pushdown', reps: '12-15', sets: 3 },
  { id: 'kickbacks', name: 'Tricep Kickbacks', reps: '12-15', sets: 3 },
];

export const absExercises: Exercise[] = [
  { id: 'crunches', name: 'Crunches', reps: '20-30', sets: 4 },
  { id: 'planks', name: 'Planks (60s)', reps: '3-5', sets: 3 },
  { id: 'leg-raises', name: 'Leg Raises', reps: '15-20', sets: 3 },
  { id: 'russian-twists', name: 'Russian Twists', reps: '20-30', sets: 3 },
  { id: 'bicycle-crunches', name: 'Bicycle Crunches', reps: '20-30', sets: 3 },
  { id: 'mountain-climbers', name: 'Mountain Climbers', reps: '30-40', sets: 3 },
  { id: 'hanging-knee-raise', name: 'Hanging Knee Raise', reps: '12-15', sets: 3 },
];

export const legsExercises: Exercise[] = [
  { id: 'squats', name: 'Barbell Squats', reps: '8-12', sets: 4 },
  { id: 'leg-press', name: 'Leg Press', reps: '10-15', sets: 4 },
  { id: 'lunges', name: 'Lunges', reps: '10-12', sets: 3 },
  { id: 'leg-curl', name: 'Leg Curl', reps: '12-15', sets: 3 },
  { id: 'leg-extension', name: 'Leg Extension', reps: '12-15', sets: 3 },
  { id: 'calf-raises', name: 'Calf Raises', reps: '15-20', sets: 4 },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', reps: '8-12', sets: 3 },
];

export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'abs' | 'legs';

export interface ExerciseCategory {
  id: MuscleGroup;
  name: string;
  exercises: Exercise[];
  icon: string;
}

export const weightTrainingCategories: ExerciseCategory[] = [
  {
    id: 'chest',
    name: 'Chest',
    exercises: chestExercises,
    icon: '💪',
  },
  {
    id: 'back',
    name: 'Back',
    exercises: backExercises,
    icon: '🔥',
  },
  {
    id: 'shoulders',
    name: 'Shoulders',
    exercises: shoulderExercises,
    icon: '🏋️',
  },
  {
    id: 'biceps',
    name: 'Biceps',
    exercises: bicepsExercises,
    icon: '💪',
  },
  {
    id: 'triceps',
    name: 'Triceps',
    exercises: tricepsExercises,
    icon: '🔱',
  },
  {
    id: 'abs',
    name: 'Abs',
    exercises: absExercises,
    icon: '🎯',
  },
  {
    id: 'legs',
    name: 'Legs',
    exercises: legsExercises,
    icon: '🦵',
  },
];
