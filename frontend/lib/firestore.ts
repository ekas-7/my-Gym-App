import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  IFitnessLog,
  IMeal,
  IExercise,
  IUserProfile,
  IWeightLog,
} from './types';

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Format a Date as YYYY-MM-DD (used as Firestore document IDs for daily records). */
function dateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Convert a Firestore Timestamp or Date-like value back to a JS Date. */
function toDate(val: unknown): Date {
  if (!val) return new Date();
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val as string);
}

/** Strip undefined fields so Firestore doesn't complain. */
function clean<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

// ─── User profile ─────────────────────────────────────────────────────────────

const profileRef = (uid: string) =>
  doc(db, 'users', uid, 'profile', 'data');

export async function getProfile(uid: string): Promise<IUserProfile | null> {
  const snap = await getDoc(profileRef(uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    ...d,
    id: snap.id,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  } as IUserProfile;
}

export async function saveProfile(uid: string, data: Partial<IUserProfile>): Promise<void> {
  const now = Timestamp.now();
  const existing = await getDoc(profileRef(uid));
  if (existing.exists()) {
    await updateDoc(profileRef(uid), { ...clean(data), updatedAt: now });
  } else {
    await setDoc(profileRef(uid), { ...clean(data), createdAt: now, updatedAt: now });
  }
}

// ─── Fitness log ──────────────────────────────────────────────────────────────

const logRef = (uid: string, date: Date) =>
  doc(db, 'users', uid, 'fitnessLogs', dateKey(date));

export async function getTodayLog(uid: string, date: Date): Promise<IFitnessLog | null> {
  const snap = await getDoc(logRef(uid, date));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    ...d,
    id: snap.id,
    date: toDate(d.date),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  } as IFitnessLog;
}

export async function saveLog(uid: string, date: Date, data: Partial<IFitnessLog>): Promise<void> {
  const now = Timestamp.now();
  const ref = logRef(uid, date);
  const existing = await getDoc(ref);

  const payload = {
    ...clean(data),
    date: Timestamp.fromDate(date),
    updatedAt: now,
  };

  if (existing.exists()) {
    await updateDoc(ref, payload);
  } else {
    await setDoc(ref, { ...payload, createdAt: now });
  }
}

export async function getStreakLogs(uid: string, days: number): Promise<IFitnessLog[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const q = query(
    collection(db, 'users', uid, 'fitnessLogs'),
    where('date', '>=', Timestamp.fromDate(cutoff)),
    orderBy('date', 'desc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      date: toDate(data.date),
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as IFitnessLog;
  });
}

// ─── Meals ────────────────────────────────────────────────────────────────────

const mealsCol = (uid: string) => collection(db, 'users', uid, 'meals');

function docToMeal(d: DocumentData, id: string): IMeal {
  return {
    ...d,
    id,
    date: toDate(d.date),
    timestamp: toDate(d.timestamp),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  } as IMeal;
}

export async function getMeals(uid: string, date: Date): Promise<IMeal[]> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const q = query(
    mealsCol(uid),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end)),
    orderBy('date', 'asc'),
    orderBy('timestamp', 'asc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => docToMeal(d.data(), d.id));
}

export async function getMealsByPeriod(uid: string, startDate: Date, endDate: Date): Promise<IMeal[]> {
  const q = query(
    mealsCol(uid),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToMeal(d.data(), d.id));
}

export async function addMeal(uid: string, meal: Omit<IMeal, 'id'>): Promise<IMeal> {
  const now = Timestamp.now();
  const payload = {
    ...clean(meal),
    date: Timestamp.fromDate(new Date(meal.date)),
    timestamp: Timestamp.fromDate(new Date(meal.timestamp)),
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(mealsCol(uid), payload);
  return { ...meal, id: ref.id };
}

export async function updateMeal(uid: string, id: string, data: Partial<IMeal>): Promise<void> {
  const ref = doc(db, 'users', uid, 'meals', id);
  await updateDoc(ref, { ...clean(data), updatedAt: Timestamp.now() });
}

export async function deleteMeal(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'meals', id));
}

// ─── Exercises ────────────────────────────────────────────────────────────────

const exercisesCol = (uid: string) => collection(db, 'users', uid, 'exercises');

function docToExercise(d: DocumentData, id: string): IExercise {
  return {
    ...d,
    id,
    date: toDate(d.date),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  } as IExercise;
}

export async function getExercises(uid: string, date: Date): Promise<IExercise[]> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const q = query(
    exercisesCol(uid),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end)),
    orderBy('date', 'asc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => docToExercise(d.data(), d.id));
}

export async function getExercisesByPeriod(uid: string, startDate: Date, endDate: Date): Promise<IExercise[]> {
  const q = query(
    exercisesCol(uid),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToExercise(d.data(), d.id));
}

export async function addExercise(uid: string, exercise: Omit<IExercise, 'id'>): Promise<IExercise> {
  const now = Timestamp.now();
  const payload = {
    ...clean(exercise),
    date: Timestamp.fromDate(new Date(exercise.date)),
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(exercisesCol(uid), payload);
  return { ...exercise, id: ref.id };
}

export async function updateExercise(uid: string, id: string, data: Partial<IExercise>): Promise<void> {
  const ref = doc(db, 'users', uid, 'exercises', id);
  await updateDoc(ref, { ...clean(data), updatedAt: Timestamp.now() });
}

export async function deleteExercise(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'exercises', id));
}

// ─── Weight log ───────────────────────────────────────────────────────────────

const weightLogRef = (uid: string, date: Date) =>
  doc(db, 'users', uid, 'weightLogs', dateKey(date));

export async function getWeightLogs(uid: string, days: number): Promise<IWeightLog[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const q = query(
    collection(db, 'users', uid, 'weightLogs'),
    where('date', '>=', Timestamp.fromDate(cutoff)),
    orderBy('date', 'asc'),
    limit(days + 1)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      date: toDate(data.date),
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as IWeightLog;
  });
}

export async function saveWeightLog(uid: string, date: Date, data: Partial<IWeightLog>): Promise<void> {
  const now = Timestamp.now();
  const ref = weightLogRef(uid, date);
  const existing = await getDoc(ref);

  const payload = {
    ...clean(data),
    date: Timestamp.fromDate(date),
    updatedAt: now,
  };

  if (existing.exists()) {
    await updateDoc(ref, payload);
  } else {
    await setDoc(ref, { ...payload, createdAt: now });
  }
}
