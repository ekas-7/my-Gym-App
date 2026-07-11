"use client";

import { useState, useEffect, useCallback } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import {
  getProfile, saveProfile, getTodayLog, saveLog,
  getMeals, addMeal, deleteMeal,
  getExercises, addExercise, deleteExercise,
  saveWeightLog, getStreakLogs,
} from "@/lib/firestore";
import { IFitnessLog, IMeal, IExercise, IUserProfile } from "@/lib/types";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Droplet, Utensils, Dumbbell, TrendingUp, Target,
  Heart, Scale, Sparkles, Download, FileText,
  Loader2, Brain, Award, AlertCircle, CheckCircle2,
  LogOut, Flame, BarChart3, Activity,
} from "lucide-react";
import { CustomizableExerciseItem } from "@/components/customizable-exercise-item";
import { CustomizableCardioItem } from "@/components/customizable-cardio-item";
import StreakStats from "@/components/streak-stats";
import StreakCalendar from "@/components/streak-calendar";
import { MealHistory, MealTypeSelect } from "@/components/meal-history";
import { ExerciseHistory } from "@/components/exercise-history";
import { WeightGraph } from "@/components/weight-graph";
import { cardioExercises, weightTrainingCategories } from "@/lib/exercises";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SummaryData {
  period: string;
  water: { consumed: number; goal: number; percentage: number };
  calories: { consumed: number; goal: number; percentage: number };
  exercise: { calories: number; goal: number; percentage: number };
  totalDays: number;
}

interface AIAnalysis {
  overallScore: number;
  highlights: string[];
  areasToImprove: string[];
  hydrationInsight: string;
  nutritionInsight: string;
  exerciseInsight: string;
  weeklyTip: string;
  motivationalMessage: string;
}

// ─── Circular ring progress ───────────────────────────────────────────────────

function RingProgress({
  value, max, color, icon, label, sublabel,
}: {
  value: number; max: number; color: string;
  icon: React.ReactNode; label: string; sublabel: string;
}) {
  const pct = Math.min((value / Math.max(max, 0.01)) * 100, 100);
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-[72px] h-[72px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="6" />
          <circle
            cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={dash}
            strokeLinecap="round" className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">{icon}</div>
      </div>
      <div className="text-center leading-tight">
        <div className="text-sm font-bold">{label}</div>
        <div className="text-[10px] text-muted-foreground">{sublabel}</div>
      </div>
    </div>
  );
}

// ─── Bottom nav item ──────────────────────────────────────────────────────────

const NAV = [
  { id: 'hydration', icon: Droplet,   label: 'Water',    color: 'text-blue-400' },
  { id: 'diet',      icon: Utensils,  label: 'Diet',     color: 'text-green-400' },
  { id: 'exercise',  icon: Dumbbell,  label: 'Exercise', color: 'text-purple-400' },
  { id: 'weight',    icon: Scale,     label: 'Weight',   color: 'text-pink-400' },
  { id: 'streak',    icon: Flame,     label: 'Streak',   color: 'text-orange-400' },
  { id: 'summary',   icon: BarChart3, label: 'Summary',  color: 'text-teal-400' },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayMidnight() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}

function computeStreak(water: number, wGoal: number, cal: number, cGoal: number, ex: number, eGoal: number) {
  const ok = [water >= wGoal, cal >= cGoal * 0.9, ex >= eGoal];
  return { goalsCompleted: ok.filter(Boolean).length, isStreakDay: ok.every(Boolean) };
}

function computeSummary(logs: IFitnessLog[], period: 'day' | 'week' | 'month' | 'year'): SummaryData {
  const now = new Date();
  let start = new Date(now);
  if (period === 'day') { start.setHours(0, 0, 0, 0); }
  else if (period === 'week') { start.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)); start.setHours(0, 0, 0, 0); }
  else if (period === 'month') { start.setDate(1); start.setHours(0, 0, 0, 0); }
  else { start = new Date(now.getFullYear(), 0, 1); }

  const f = logs.filter(l => new Date(l.date) >= start);
  const tw = f.reduce((s, l) => s + (l.waterLiters || 0), 0);
  const twg = f.reduce((s, l) => s + (l.waterGoal || 4), 0) || 4;
  const tc = f.reduce((s, l) => s + (l.calories || 0), 0);
  const tcg = f.reduce((s, l) => s + (l.calorieGoal || 2000), 0) || 2000;
  const te = f.reduce((s, l) => s + (l.exerciseCalories || 0), 0);
  const teg = f.reduce((s, l) => s + (l.exerciseGoal || 500), 0) || 500;
  const n = Math.max(f.length, 1);

  return {
    period,
    water: { consumed: tw, goal: twg / n, percentage: Math.round((tw / Math.max(twg, 0.01)) * 100) },
    calories: { consumed: tc, goal: tcg / n, percentage: Math.round((tc / Math.max(tcg, 1)) * 100) },
    exercise: { calories: te, goal: teg / n, percentage: Math.round((te / Math.max(teg, 1)) * 100) },
    totalDays: n,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => onAuthStateChanged(auth, u => { setCurrentUser(u); setAuthLoading(false); }), []);

  // Daily state
  const [waterIntake, setWaterIntake] = useState(0);
  const [dailyWaterGoal, setDailyWaterGoal] = useState(4);
  const [calories, setCalories] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [carbs, setCarbs] = useState(0);
  const [carbsGoal, setCarbsGoal] = useState(250);
  const [fats, setFats] = useState(0);
  const [fatsGoal, setFatsGoal] = useState(65);
  const [protein, setProtein] = useState(0);
  const [proteinGoal, setProteinGoal] = useState(190);
  const [exerciseCalories, setExerciseCalories] = useState(0);
  const [exerciseGoal, setExerciseGoal] = useState(500);
  const [todayWeight, setTodayWeight] = useState<number | null>(null);
  const [todayBodyFat, setTodayBodyFat] = useState<number | null>(null);
  const [weightSaved, setWeightSaved] = useState(false);

  // App state
  const [meals, setMeals] = useState<IMeal[]>([]);
  const [exercises, setExercises] = useState<IExercise[]>([]);
  const [streakLogs, setStreakLogs] = useState<IFitnessLog[]>([]);
  const [userProfile, setUserProfile] = useState<IUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('hydration');

  // AI / summary
  const [summaryPeriod, setSummaryPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Input state
  const [foodDescription, setFoodDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [mealType, setMealType] = useState('other');
  const [exerciseDescription, setExerciseDescription] = useState('');
  const [isAnalyzingExercise, setIsAnalyzingExercise] = useState(false);
  const [exerciseAnalysisError, setExerciseAnalysisError] = useState('');
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [exerciseCategory, setExerciseCategory] = useState<'cardio' | 'weight-training'>('cardio');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'abs' | 'legs'>('chest');

  // Tab persistence
  useEffect(() => {
    const saved = localStorage.getItem('fitnessAppActiveTab');
    if (saved) setActiveTab(saved);
  }, []);
  useEffect(() => {
    if (isMounted) localStorage.setItem('fitnessAppActiveTab', activeTab);
  }, [activeTab, isMounted]);

  // ─── Data ────────────────────────────────────────────────────────────────────

  const fetchUserProfile = useCallback(async (uid: string) => {
    const p = await getProfile(uid);
    if (p) {
      setUserProfile(p);
      setDailyWaterGoal(p.waterGoal || 4);
      setCalorieGoal(p.dailyCalorieTarget || 2000);
      setExerciseGoal(p.exerciseGoal || 500);
      if (p.dailyProteinTarget) setProteinGoal(p.dailyProteinTarget);
    }
  }, []);

  const fetchTodayData = useCallback(async (uid: string) => {
    const log = await getTodayLog(uid, todayMidnight());
    if (log) {
      setWaterIntake(log.waterLiters || 0);
      setExerciseCalories(log.exerciseCalories || 0);
      setTodayWeight(log.weight ?? null);
      setTodayBodyFat(log.bodyFatPercentage ?? null);
    }
    setIsLoading(false);
  }, []);

  const fetchMeals = useCallback(async (uid: string) => {
    const m = await getMeals(uid, todayMidnight());
    setMeals(m);
    setCalories(m.reduce((s, x) => s + x.calories, 0));
    setCarbs(m.reduce((s, x) => s + x.carbs, 0));
    setFats(m.reduce((s, x) => s + x.fats, 0));
    setProtein(m.reduce((s, x) => s + x.protein, 0));
  }, []);

  const fetchExercises = useCallback(async (uid: string): Promise<number> => {
    const ex = await getExercises(uid, todayMidnight());
    setExercises(ex);
    const total = ex.reduce((s, x) => s + (x.caloriesBurned || 0), 0);
    setExerciseCalories(total);
    return total;
  }, []);

  const fetchStreak = useCallback(async (uid: string) => {
    const logs = await getStreakLogs(uid, 90);
    setStreakLogs(logs);
    return logs;
  }, []);

  const fetchSummaryData = useCallback(async (uid: string, period: typeof summaryPeriod) => {
    setIsSummaryLoading(true);
    const logs = await getStreakLogs(uid, period === 'year' ? 365 : period === 'month' ? 31 : period === 'week' ? 7 : 1);
    setSummaryData(computeSummary(logs, period));
    setIsSummaryLoading(false);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    setIsLoading(true);
    Promise.all([fetchUserProfile(uid), fetchTodayData(uid), fetchStreak(uid), fetchMeals(uid), fetchExercises(uid)]);
  }, [currentUser, fetchUserProfile, fetchTodayData, fetchStreak, fetchMeals, fetchExercises]);

  useEffect(() => {
    if (!currentUser) return;
    fetchSummaryData(currentUser.uid, summaryPeriod);
    setAiAnalysis(null);
  }, [summaryPeriod, currentUser, fetchSummaryData]);

  // ─── Fitness log update ──────────────────────────────────────────────────────

  const updateLog = useCallback(async (data: {
    waterLiters?: number; calories?: number; carbs?: number; fats?: number;
    protein?: number; exerciseCalories?: number; weight?: number; bodyFatPercentage?: number;
  }, currentWater = waterIntake, currentCal = calories, currentEx = exerciseCalories) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const today = todayMidnight();
    const w = data.waterLiters ?? currentWater;
    const c = data.calories ?? currentCal;
    const e = data.exerciseCalories ?? currentEx;
    const { goalsCompleted, isStreakDay } = computeStreak(w, dailyWaterGoal, c, calorieGoal, e, exerciseGoal);

    await saveLog(uid, today, {
      date: today, waterLiters: w, waterGoal: dailyWaterGoal,
      calories: c, calorieGoal, carbs: data.carbs ?? carbs, carbsGoal,
      fats: data.fats ?? fats, fatsGoal, protein: data.protein ?? protein, proteinGoal,
      exerciseCalories: e, exerciseGoal, exercises: [], weight: data.weight,
      bodyFatPercentage: data.bodyFatPercentage, goalsCompleted, totalGoals: 3, isStreakDay,
    });

    fetchStreak(uid);
    fetchSummaryData(uid, summaryPeriod);

    if (data.weight !== undefined || data.bodyFatPercentage !== undefined) {
      const up: Partial<IUserProfile> = {};
      if (data.weight !== undefined) up.currentWeight = data.weight;
      if (data.bodyFatPercentage !== undefined) up.bodyFatPercentage = data.bodyFatPercentage;
      await saveProfile(uid, up);
      fetchUserProfile(uid);
    }
  }, [currentUser, waterIntake, calories, exerciseCalories, dailyWaterGoal, calorieGoal, exerciseGoal, carbs, carbsGoal, fats, fatsGoal, protein, proteinGoal, summaryPeriod, fetchStreak, fetchSummaryData, fetchUserProfile]);

  const addWater = () => { const n = waterIntake + 0.25; setWaterIntake(n); updateLog({ waterLiters: n }, n); };
  const removeWater = () => { const n = Math.max(waterIntake - 0.25, 0); setWaterIntake(n); updateLog({ waterLiters: n }, n); };

  // ─── Meals ───────────────────────────────────────────────────────────────────

  const analyzeFood = async () => {
    if (!foodDescription.trim() || !currentUser) return;
    setIsAnalyzing(true); setAnalysisError('');
    try {
      const r = await fetch('/api/diet/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ foodDescription }) });
      const res = await r.json();
      if (res.success) {
        const { calories: cal, carbs: c, fats: f, protein: p } = res.data;
        await addMeal(currentUser.uid, { description: foodDescription, mealType: mealType as IMeal['mealType'], calories: cal, carbs: c, fats: f, protein: p, isAIAnalyzed: true, date: new Date(), timestamp: new Date() });
        await fetchMeals(currentUser.uid);
        updateLog({ calories: calories + cal, carbs: carbs + c, fats: fats + f, protein: protein + p });
        setFoodDescription('');
      } else { setAnalysisError(res.error || 'Failed to analyze'); }
    } catch { setAnalysisError('Network error. Try again.'); }
    finally { setIsAnalyzing(false); }
  };

  const handleDeleteMeal = async (id: string) => {
    if (!currentUser) return;
    await deleteMeal(currentUser.uid, id);
    await fetchMeals(currentUser.uid);
  };

  // ─── Exercises ───────────────────────────────────────────────────────────────

  const analyzeExercise = async () => {
    if (!exerciseDescription.trim() || !currentUser) return;
    setIsAnalyzingExercise(true); setExerciseAnalysisError('');
    try {
      const r = await fetch('/api/exercises/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exerciseDescription }) });
      const res = await r.json();
      if (res.success) {
        const ex = res.data;
        const sets = ex.category === 'weight-training' && ex.sets && ex.reps
          ? Array.from({ length: ex.sets }, (_, i) => ({ setNumber: i + 1, weight: ex.weight || 0, reps: ex.reps, completed: true }))
          : [];
        await addExercise(currentUser.uid, { name: ex.name, category: ex.category, muscleGroup: ex.muscleGroup, sets, duration: ex.duration, distance: ex.distance, caloriesBurned: ex.caloriesBurned, isAIAnalyzed: true, description: exerciseDescription, date: new Date() });
        const total = await fetchExercises(currentUser.uid);
        updateLog({ exerciseCalories: total }, undefined, undefined, total);
        setExerciseDescription('');
      } else { setExerciseAnalysisError(res.error || 'Failed'); }
    } catch { setExerciseAnalysisError('Network error.'); }
    finally { setIsAnalyzingExercise(false); }
  };

  const handleDeleteExercise = async (id: string) => {
    if (!currentUser) return;
    await deleteExercise(currentUser.uid, id);
    const total = await fetchExercises(currentUser.uid);
    updateLog({ exerciseCalories: total }, undefined, undefined, total);
  };

  const saveQuickExercise = async (name: string, category: 'cardio' | 'weight-training', duration?: number, sets?: number, reps?: string, muscleGroup?: string, weight?: number, distance?: number) => {
    if (!currentUser) return;
    const setsArr = category === 'weight-training' && sets && reps
      ? Array.from({ length: sets }, (_, i) => ({ setNumber: i + 1, weight: weight || 0, reps: parseInt(reps.split('-')[0]) || 10, completed: true }))
      : [];
    await addExercise(currentUser.uid, { name, category, muscleGroup: muscleGroup as IExercise['muscleGroup'], sets: setsArr, duration, distance, caloriesBurned: duration ? duration * 8 : sets ? sets * 15 : 0, isAIAnalyzed: false, date: new Date() });
    const total = await fetchExercises(currentUser.uid);
    updateLog({ exerciseCalories: total }, undefined, undefined, total);
  };

  const toggleExercise = (id: string) => setCompletedExercises(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // ─── Summary / AI / Export ───────────────────────────────────────────────────

  const getSd = () => summaryData && summaryData.period === summaryPeriod ? summaryData : {
    period: summaryPeriod,
    water: { consumed: waterIntake, goal: dailyWaterGoal, percentage: Math.round((waterIntake / dailyWaterGoal) * 100) },
    calories: { consumed: calories, goal: calorieGoal, percentage: Math.round((calories / calorieGoal) * 100) },
    exercise: { calories: exerciseCalories, goal: exerciseGoal, percentage: Math.round((exerciseCalories / exerciseGoal) * 100) },
    totalDays: 1,
  };

  const fetchAIAnalysis = async () => {
    if (!currentUser) return;
    setIsAnalyzingAI(true); setAiAnalysis(null);
    try {
      const r = await fetch('/api/fitness/summary/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary: getSd(), period: summaryPeriod }) });
      const res = await r.json();
      if (res.success) setAiAnalysis(res.data.analysis);
    } catch { /* silent */ }
    finally { setIsAnalyzingAI(false); }
  };

  const exportData = (format: 'csv' | 'json') => {
    const sd = getSd();
    const data = { summary: sd, exportedAt: new Date().toISOString() };
    const content = format === 'csv'
      ? `Period,Water(L),Calories,Exercise Cal\n${sd.period},${sd.water.consumed.toFixed(2)},${sd.calories.consumed},${sd.exercise.calories}`
      : JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `fitness-${sd.period}-${new Date().toISOString().split('T')[0]}.${format}` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ─── Auth ─────────────────────────────────────────────────────────────────────

  const handleSignIn = () => signInWithPopup(auth, googleProvider).catch(console.error);
  const handleSignOut = async () => {
    await signOut(auth);
    [setWaterIntake, setCalories, setCarbs, setFats, setProtein, setExerciseCalories].forEach(s => s(0));
    [setMeals, setExercises, setStreakLogs].forEach((s: any) => s([]));
    setUserProfile(null); setSummaryData(null); setAiAnalysis(null); setTodayWeight(null); setTodayBodyFat(null);
  };

  // ─── Loading screen ───────────────────────────────────────────────────────────

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/25">
          <Dumbbell className="h-8 w-8 text-white" />
        </div>
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
      </div>
    </div>
  );

  // ─── Sign-in screen ───────────────────────────────────────────────────────────

  if (!currentUser) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-8">
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/30">
          <Dumbbell className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">FitTrack</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Track water, nutrition, exercise &amp; streaks — all in one place
        </p>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-2 max-w-xs">
        {[
          { icon: Droplet, label: 'Hydration', color: 'text-blue-400 bg-blue-400/10' },
          { icon: Utensils, label: 'AI Nutrition', color: 'text-green-400 bg-green-400/10' },
          { icon: Dumbbell, label: 'Workouts', color: 'text-purple-400 bg-purple-400/10' },
          { icon: Flame, label: 'Streaks', color: 'text-orange-400 bg-orange-400/10' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${color}`}>
            <Icon className="h-3 w-3" />
            {label}
          </div>
        ))}
      </div>

      <Button size="lg" className="w-full max-w-xs h-14 rounded-2xl text-base font-semibold shadow-lg" onClick={handleSignIn}>
        <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </Button>
      <p className="text-xs text-muted-foreground">Your data is private and secure</p>
    </div>
  );

  // ─── Main app ─────────────────────────────────────────────────────────────────

  const overallPct = Math.round(((waterIntake / dailyWaterGoal + calories / calorieGoal + exerciseCalories / exerciseGoal) / 3) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── Sticky top header ── */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground leading-none">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}</div>
              <div className="text-sm font-semibold leading-tight truncate max-w-[140px]">{currentUser.displayName?.split(' ')[0] ?? 'Athlete'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right mr-1">
              <div className="text-xs text-muted-foreground">Today</div>
              <div className="text-sm font-bold">{overallPct}%</div>
            </div>
            {currentUser.photoURL
              ? <img src={currentUser.photoURL} alt="" className="w-8 h-8 rounded-full border border-border cursor-pointer" onClick={handleSignOut} />
              : <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSignOut}><LogOut className="h-4 w-4" /></Button>
            }
          </div>
        </div>
      </header>

      {/* ── Today's ring progress hero ── */}
      <div className="px-4 pt-4 pb-2 max-w-2xl mx-auto w-full">
        <div className="bg-card rounded-2xl border border-border/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Progress</span>
            <Badge variant={overallPct >= 100 ? 'default' : 'secondary'} className="text-xs">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Badge>
          </div>
          {isLoading ? (
            <div className="flex justify-around py-2">
              {[1,2,3].map(i => <div key={i} className="w-[72px] h-[72px] rounded-full bg-muted animate-pulse" />)}
            </div>
          ) : (
            <div className="flex justify-around">
              <RingProgress value={waterIntake} max={dailyWaterGoal} color="#3b82f6" label={`${waterIntake.toFixed(1)}L`} sublabel="Water" icon={<Droplet className="h-5 w-5 text-blue-400" />} />
              <RingProgress value={calories} max={calorieGoal} color="#22c55e" label={`${calories}`} sublabel="kcal" icon={<Utensils className="h-5 w-5 text-green-400" />} />
              <RingProgress value={exerciseCalories} max={exerciseGoal} color="#a855f7" label={`${exerciseCalories}`} sublabel="burned" icon={<Flame className="h-5 w-5 text-purple-400" />} />
            </div>
          )}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab}>

          {/* ── HYDRATION ─────────────────────────────────────────────────── */}
          <TabsContent value="hydration" className="mt-0 px-4 py-3 max-w-2xl mx-auto space-y-3">
            <div className="bg-card rounded-2xl border border-border/60 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2"><Droplet className="h-4 w-4 text-blue-400" />Water Intake</h2>
                <Badge variant={waterIntake >= dailyWaterGoal ? 'default' : 'secondary'}>{waterIntake.toFixed(2)} / {dailyWaterGoal} L</Badge>
              </div>
              <Progress value={(waterIntake / dailyWaterGoal) * 100} className="h-2.5 rounded-full" />
              <div className="flex gap-2">
                <Button onClick={addWater} className="flex-1 h-12 rounded-xl" disabled={waterIntake >= dailyWaterGoal}>
                  <Droplet className="h-4 w-4 mr-1.5" />+250ml
                </Button>
                <Button variant="outline" onClick={removeWater} className="flex-1 h-12 rounded-xl" disabled={waterIntake === 0}>−250ml</Button>
                <Button variant="outline" onClick={() => { setWaterIntake(0); updateLog({ waterLiters: 0 }, 0); }} className="h-12 rounded-xl px-4">Reset</Button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {Array.from({ length: 16 }).map((_, i) => {
                  const t = (i + 1) * 0.25;
                  return (
                    <div key={i} className={`h-12 rounded-xl border flex items-center justify-center transition-all ${waterIntake >= t ? 'bg-blue-500/20 border-blue-500/50' : 'bg-muted/50 border-border/30'}`}>
                      {waterIntake >= t && <Droplet className="h-4 w-4 text-blue-400" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ── DIET ──────────────────────────────────────────────────────── */}
          <TabsContent value="diet" className="mt-0 px-4 py-3 max-w-2xl mx-auto space-y-3">
            <div className="bg-card rounded-2xl border border-border/60 p-4 space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><Utensils className="h-4 w-4 text-green-400" />Nutrition</h2>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Meal Type</label>
                <MealTypeSelect value={mealType} onChange={setMealType} />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground block">Describe your meal</label>
                <div className="flex gap-2">
                  <input
                    type="text" value={foodDescription} onChange={e => setFoodDescription(e.target.value)}
                    placeholder="e.g., 2 eggs, toast, coffee..." disabled={isAnalyzing}
                    onKeyPress={e => e.key === 'Enter' && analyzeFood()}
                    className="flex-1 rounded-xl border border-input bg-muted/50 px-3 py-2.5 text-sm"
                  />
                  <Button onClick={analyzeFood} disabled={isAnalyzing || !foodDescription.trim()} className="rounded-xl h-10">
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                </div>
                {analysisError && <p className="text-xs text-red-500">{analysisError}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Calories', value: calories, goal: calorieGoal, unit: 'kcal', color: 'text-green-400', bg: 'bg-green-400/10' },
                  { label: 'Protein', value: protein, goal: proteinGoal, unit: 'g', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                  { label: 'Carbs', value: carbs, goal: carbsGoal, unit: 'g', color: 'text-orange-400', bg: 'bg-orange-400/10' },
                  { label: 'Fats', value: fats, goal: fatsGoal, unit: 'g', color: 'text-pink-400', bg: 'bg-pink-400/10' },
                ].map(({ label, value, goal, unit, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl p-3 space-y-1.5`}>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className={`text-xs font-medium ${color}`}>{unit}</span>
                    </div>
                    <div className="text-xl font-bold">{typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}</div>
                    <Progress value={(value / goal) * 100} className="h-1.5 rounded-full" />
                    <div className="text-[10px] text-muted-foreground">/ {goal} {unit}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Today's Meals</span>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setCalories(0); setCarbs(0); setFats(0); setProtein(0); updateLog({ calories: 0, carbs: 0, fats: 0, protein: 0 }); }}>Clear all</Button>
              </div>
              <div className="px-4 pb-4">
                <MealHistory meals={meals} onDelete={handleDeleteMeal} />
              </div>
            </div>
          </TabsContent>

          {/* ── EXERCISE ──────────────────────────────────────────────────── */}
          <TabsContent value="exercise" className="mt-0 px-4 py-3 max-w-2xl mx-auto space-y-3">
            <div className="bg-card rounded-2xl border border-border/60 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2"><Dumbbell className="h-4 w-4 text-purple-400" />Exercise</h2>
                <Badge variant={exerciseCalories >= exerciseGoal ? 'default' : 'secondary'}>{exerciseCalories} / {exerciseGoal} cal</Badge>
              </div>
              <Progress value={(exerciseCalories / exerciseGoal) * 100} className="h-2.5 rounded-full" />

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text" value={exerciseDescription} onChange={e => setExerciseDescription(e.target.value)}
                    placeholder="e.g., 3x10 bench press 80kg..." disabled={isAnalyzingExercise}
                    onKeyPress={e => e.key === 'Enter' && analyzeExercise()}
                    className="flex-1 rounded-xl border border-input bg-muted/50 px-3 py-2.5 text-sm"
                  />
                  <Button onClick={analyzeExercise} disabled={isAnalyzingExercise || !exerciseDescription.trim()} className="rounded-xl h-10">
                    {isAnalyzingExercise ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                </div>
                {exerciseAnalysisError && <p className="text-xs text-red-500">{exerciseAnalysisError}</p>}
              </div>

              <div className="flex gap-2">
                {(['cardio', 'weight-training'] as const).map(cat => (
                  <button key={cat} onClick={() => setExerciseCategory(cat)}
                    className={`flex-1 h-10 rounded-xl text-sm font-medium border transition-all ${exerciseCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-muted/30 text-muted-foreground'}`}>
                    {cat === 'cardio' ? '🏃 Cardio' : '🏋️ Weights'}
                  </button>
                ))}
              </div>

              {exerciseCategory === 'cardio' && (
                <div className="space-y-2">
                  {cardioExercises.map(ex => (
                    <CustomizableCardioItem key={ex.id} name={ex.name} defaultDuration={ex.duration} defaultDistance={ex.distance}
                      isCompleted={completedExercises.has(ex.id)}
                      onAdd={async (dur, dist) => { const was = completedExercises.has(ex.id); toggleExercise(ex.id); if (!was) await saveQuickExercise(ex.name, 'cardio', dur, undefined, undefined, undefined, undefined, dist); }} />
                  ))}
                </div>
              )}

              {exerciseCategory === 'weight-training' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-1.5">
                    {weightTrainingCategories.map(cat => (
                      <button key={cat.id} onClick={() => setSelectedMuscleGroup(cat.id)}
                        className={`flex flex-col items-center py-2 rounded-xl border text-xs transition-all ${selectedMuscleGroup === cat.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-muted/30'}`}>
                        <span className="text-base">{cat.icon}</span>{cat.name}
                      </button>
                    ))}
                  </div>
                  {weightTrainingCategories.filter(c => c.id === selectedMuscleGroup).map(cat => (
                    <div key={cat.id} className="space-y-2">
                      {cat.exercises.map(ex => (
                        <CustomizableExerciseItem key={ex.id} name={ex.name} defaultReps={ex.reps} defaultSets={ex.sets} defaultWeight={0}
                          isCompleted={completedExercises.has(ex.id)}
                          onAdd={async (sets, reps, weight) => { const was = completedExercises.has(ex.id); toggleExercise(ex.id); if (!was) await saveQuickExercise(ex.name, 'weight-training', undefined, sets, reps, cat.id, weight); }} />
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <Button variant="outline" className="w-full h-11 rounded-xl" onClick={() => { setExerciseCalories(0); setCompletedExercises(new Set()); updateLog({ exerciseCalories: 0 }); }}>
                Reset Daily Progress
              </Button>
            </div>

            <div className="bg-card rounded-2xl border border-border/60 p-4">
              <h3 className="text-sm font-semibold mb-3">Exercise History</h3>
              <ExerciseHistory exercises={exercises} onDelete={handleDeleteExercise} />
            </div>
          </TabsContent>

          {/* ── WEIGHT ────────────────────────────────────────────────────── */}
          <TabsContent value="weight" className="mt-0 px-4 py-3 max-w-2xl mx-auto space-y-3">
            {userProfile ? (
              <>
                <WeightGraph uid={currentUser.uid} days={30} targetWeight={userProfile.targetWeight} />
                <div className="bg-card rounded-2xl border border-border/60 p-4 space-y-4">
                  <h2 className="font-semibold flex items-center gap-2"><Scale className="h-4 w-4 text-pink-400" />Today's Measurements</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Weight (kg)</label>
                      <input type="number" step="0.1" value={todayWeight || ''}
                        onChange={e => { setTodayWeight(parseFloat(e.target.value) || null); setWeightSaved(false); }}
                        placeholder={userProfile.currentWeight.toString()}
                        className="w-full rounded-xl border border-input bg-muted/50 px-3 py-2.5 text-sm" />
                      {todayWeight && <p className="text-xs text-muted-foreground">{todayWeight > userProfile.currentWeight ? '+' : ''}{(todayWeight - userProfile.currentWeight).toFixed(1)} kg</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Body Fat (%)</label>
                      <input type="number" step="0.1" value={todayBodyFat || ''}
                        onChange={e => { setTodayBodyFat(parseFloat(e.target.value) || null); setWeightSaved(false); }}
                        placeholder={userProfile.bodyFatPercentage.toString()}
                        className="w-full rounded-xl border border-input bg-muted/50 px-3 py-2.5 text-sm" />
                    </div>
                  </div>
                  <Button className="w-full h-12 rounded-xl" disabled={!todayWeight} onClick={async () => {
                    if (!todayWeight || !currentUser) return;
                    const today = todayMidnight();
                    await saveWeightLog(currentUser.uid, today, { date: today, weight: todayWeight, bodyFatPercentage: todayBodyFat || undefined });
                    await updateLog({ weight: todayWeight, bodyFatPercentage: todayBodyFat || undefined });
                    setWeightSaved(true);
                  }}>
                    {weightSaved ? '✓ Saved!' : 'Save Measurements'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="bg-card rounded-2xl border border-border/60 p-8 text-center text-muted-foreground">Loading profile...</div>
            )}
          </TabsContent>

          {/* ── STREAK ────────────────────────────────────────────────────── */}
          <TabsContent value="streak" className="mt-0 px-4 py-3 max-w-2xl mx-auto space-y-3">
            <div className="bg-card rounded-2xl border border-border/60 p-4">
              <h2 className="font-semibold flex items-center gap-2 mb-3"><Flame className="h-4 w-4 text-orange-400" />Your Streak</h2>
              <StreakStats logs={streakLogs} />
            </div>
            <div className="bg-card rounded-2xl border border-border/60 p-4">
              <h2 className="font-semibold mb-3">Activity Heatmap</h2>
              <p className="text-xs text-muted-foreground mb-3">Green = all goals · Yellow = partial · Gray = minimal</p>
              <StreakCalendar logs={streakLogs} monthsToShow={1} />
            </div>
          </TabsContent>

          {/* ── SUMMARY ───────────────────────────────────────────────────── */}
          <TabsContent value="summary" className="mt-0 px-4 py-3 max-w-2xl mx-auto space-y-3">
            <div className="bg-card rounded-2xl border border-border/60 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-teal-400" />Summary</h2>
                <div className="flex gap-1">
                  {(['day', 'week', 'month', 'year'] as const).map(p => (
                    <button key={p} onClick={() => setSummaryPeriod(p)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${summaryPeriod === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {isSummaryLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-teal-400" /></div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Water', icon: <Droplet className="h-4 w-4 text-blue-400" />, pct: getSd().water.percentage, consumed: `${getSd().water.consumed.toFixed(1)}L`, goal: `${(getSd().water.goal * getSd().totalDays).toFixed(1)}L`, color: 'bg-blue-400' },
                    { label: 'Calories', icon: <Utensils className="h-4 w-4 text-green-400" />, pct: getSd().calories.percentage, consumed: `${Math.round(getSd().calories.consumed).toLocaleString()} kcal`, goal: `${Math.round(getSd().calories.goal * getSd().totalDays).toLocaleString()} kcal`, color: 'bg-green-400' },
                    { label: 'Exercise', icon: <Flame className="h-4 w-4 text-purple-400" />, pct: getSd().exercise.percentage, consumed: `${getSd().exercise.calories} cal`, goal: `${Math.round(getSd().exercise.goal * getSd().totalDays)} cal`, color: 'bg-purple-400' },
                  ].map(({ label, icon, pct, consumed, goal, color }) => (
                    <div key={label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5">{icon}<span className="font-medium">{label}</span></div>
                        <span className="text-muted-foreground text-xs">{consumed} / {goal}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 flex items-center justify-between border-t border-border/50">
                    <span className="text-sm text-muted-foreground">Overall</span>
                    <span className="text-2xl font-bold">{Math.round((getSd().water.percentage + getSd().calories.percentage + getSd().exercise.percentage) / 3)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Export */}
            <div className="bg-card rounded-2xl border border-border/60 p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Download className="h-4 w-4" />Export Data</h3>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => exportData('csv')}>
                  <FileText className="h-4 w-4 mr-2" />CSV
                </Button>
                <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => exportData('json')}>
                  <Download className="h-4 w-4 mr-2" />JSON
                </Button>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-card rounded-2xl border border-border/60 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Brain className="h-4 w-4 text-pink-400" />AI Coach</h3>
                <Button size="sm" onClick={fetchAIAnalysis} disabled={isAnalyzingAI} className="h-8 rounded-xl text-xs">
                  {isAnalyzingAI ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                  Analyze
                </Button>
              </div>

              {isAnalyzingAI ? (
                <div className="flex flex-col items-center py-6 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-pink-400" />
                  <p className="text-xs text-muted-foreground">Crunching your data...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl">
                    <div className="text-5xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">{aiAnalysis.overallScore}</div>
                    <p className="text-xs text-muted-foreground mt-1">Fitness Score</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: <Droplet className="h-3.5 w-3.5 text-blue-400" />, label: 'Hydration', text: aiAnalysis.hydrationInsight, bg: 'bg-blue-400/10' },
                      { icon: <Utensils className="h-3.5 w-3.5 text-green-400" />, label: 'Nutrition', text: aiAnalysis.nutritionInsight, bg: 'bg-green-400/10' },
                      { icon: <Dumbbell className="h-3.5 w-3.5 text-purple-400" />, label: 'Exercise', text: aiAnalysis.exerciseInsight, bg: 'bg-purple-400/10' },
                    ].map(({ icon, label, text, bg }) => (
                      <div key={label} className={`${bg} rounded-xl p-2.5`}>
                        <div className="flex items-center gap-1 mb-1">{icon}<span className="text-[10px] font-semibold">{label}</span></div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">{text}</p>
                      </div>
                    ))}
                  </div>

                  {aiAnalysis.highlights?.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-green-500 flex items-center gap-1"><Award className="h-3 w-3" />Highlights</div>
                      {aiAnalysis.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" /><span>{h}</span></div>
                      ))}
                    </div>
                  )}

                  {aiAnalysis.areasToImprove?.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-amber-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />Improve</div>
                      {aiAnalysis.areasToImprove.map((a, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs"><AlertCircle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" /><span>{a}</span></div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl text-center border border-pink-500/20">
                    <Sparkles className="h-4 w-4 text-pink-400 mx-auto mb-1" />
                    <p className="text-xs italic text-muted-foreground">&ldquo;{aiAnalysis.motivationalMessage}&rdquo;</p>
                  </div>

                  <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                    <div className="text-xs font-semibold text-orange-400 mb-1 flex items-center gap-1"><Target className="h-3 w-3" />Tip</div>
                    <p className="text-xs">{aiAnalysis.weeklyTip}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Brain className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Tap Analyze for AI-powered fitness insights</p>
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* ── Fixed bottom navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-t border-border/50 pb-safe">
        <div className="flex items-center justify-around max-w-2xl mx-auto px-2 py-2">
          {NAV.map(({ id, icon: Icon, label, color }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-[52px] ${isActive ? 'bg-primary/10' : ''}`}
              >
                <Icon className={`h-5 w-5 transition-all ${isActive ? color : 'text-muted-foreground/60'}`} />
                <span className={`text-[10px] font-medium transition-all ${isActive ? 'text-foreground' : 'text-muted-foreground/60'}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
