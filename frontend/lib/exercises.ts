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
}

export const cardioExercises: CardioExercise[] = [
  { id: 'running', name: 'Running', duration: 30 },
  { id: 'cycling', name: 'Cycling', duration: 30 },
  { id: 'swimming', name: 'Swimming', duration: 20 },
  { id: 'jump-rope', name: 'Jump Rope', duration: 15 },
  { id: 'rowing', name: 'Rowing', duration: 20 },
  { id: 'elliptical', name: 'Elliptical', duration: 25 },
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

export type MuscleGroup = 'chest' | 'back' | 'shoulders';

export interface ExerciseCategory {
  id: MuscleGroup;
  name: string;
  exercises: Exercise[];
  icon: string;
}

export const weightTrainingCategories: ExerciseCategory[] = [
  {
    id: 'chest',
    name: 'Chest Day',
    exercises: chestExercises,
    icon: '💪',
  },
  {
    id: 'back',
    name: 'Back Day',
    exercises: backExercises,
    icon: '🔥',
  },
  {
    id: 'shoulders',
    name: 'Shoulder Day',
    exercises: shoulderExercises,
    icon: '🏋️',
  },
];
