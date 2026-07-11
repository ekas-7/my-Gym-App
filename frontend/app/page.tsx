"use client";

import { useState, useEffect, useCallback } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import {
  getProfile,
  saveProfile,
  getTodayLog,
  saveLog,
  getMeals,
  getMealsByPeriod,
  addMeal,
  deleteMeal,
  getExercises,
  getExercisesByPeriod,
  addExercise,
  deleteExercise,
  saveWeightLog,
  getStreakLogs,
} from "@/lib/firestore";
import { IFitnessLog, IMeal, IExercise, IUserProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Droplet, Utensils, Dumbbell, TrendingUp, Target,
  Calendar as CalendarIcon, Heart, Scale, Sparkles,
  Download, FileText, Loader2, Brain, Award, AlertCircle,
  CheckCircle2, LogOut,
} from "lucide-react";
import { ExerciseItem } from "@/components/exercise-item";
import { CustomizableExerciseItem } from "@/components/customizable-exercise-item";
import { CardioItem } from "@/components/cardio-item";
import { CustomizableCardioItem } from "@/components/customizable-cardio-item";
import { BodyStats } from "@/components/body-stats";
import StreakStats from "@/components/streak-stats";
import StreakCalendar from "@/components/streak-calendar";
import SidebarCalendar from "@/components/sidebar-calendar";
import { MealHistory, MealTypeSelect } from "@/components/meal-history";
import { ExerciseHistory } from "@/components/exercise-history";
import { WeightGraph } from "@/components/weight-graph";
import { cardioExercises, weightTrainingCategories } from "@/lib/exercises";

// ─── Local interfaces ────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeStreakStatus(
  water: number, waterGoal: number,
  cal: number, calGoal: number,
  exercise: number, exerciseGoal: number,
): { goalsCompleted: number; isStreakDay: boolean } {
  const waterOk = water >= waterGoal;
  const caloriesOk = cal >= calGoal * 0.9;
  const exerciseOk = exercise >= exerciseGoal;
  const goalsCompleted = [waterOk, caloriesOk, exerciseOk].filter(Boolean).length;
  return { goalsCompleted, isStreakDay: goalsCompleted >= 3 };
}

function computeSummaryFromLogs(
  logs: IFitnessLog[],
  period: 'day' | 'week' | 'month' | 'year',
): SummaryData {
  const now = new Date();
  let startDate = new Date(now);

  if (period === 'day') {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    const dow = now.getDay();
    startDate.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  const filtered = logs.filter((l) => new Date(l.date) >= startDate);

  const totalWater = filtered.reduce((s, l) => s + (l.waterLiters || 0), 0);
  const totalWaterGoal = filtered.reduce((s, l) => s + (l.waterGoal || 4), 0) || 4;
  const totalCal = filtered.reduce((s, l) => s + (l.calories || 0), 0);
  const totalCalGoal = filtered.reduce((s, l) => s + (l.calorieGoal || 2000), 0) || 2000;
  const totalEx = filtered.reduce((s, l) => s + (l.exerciseCalories || 0), 0);
  const totalExGoal = filtered.reduce((s, l) => s + (l.exerciseGoal || 500), 0) || 500;

  return {
    period,
    water: {
      consumed: totalWater,
      goal: filtered.length > 0 ? totalWaterGoal / filtered.length : 4,
      percentage: Math.round((totalWater / Math.max(totalWaterGoal, 0.01)) * 100),
    },
    calories: {
      consumed: totalCal,
      goal: filtered.length > 0 ? totalCalGoal / filtered.length : 2000,
      percentage: Math.round((totalCal / Math.max(totalCalGoal, 1)) * 100),
    },
    exercise: {
      calories: totalEx,
      goal: filtered.length > 0 ? totalExGoal / filtered.length : 500,
      percentage: Math.round((totalEx / Math.max(totalExGoal, 1)) * 100),
    },
    totalDays: Math.max(filtered.length, 1),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  // Auth
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Date
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setDate(new Date());
    setIsMounted(true);
  }, []);

  // Auth observer
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Hydration
  const [waterIntake, setWaterIntake] = useState(0);
  const [dailyWaterGoal, setDailyWaterGoal] = useState(4);

  // Diet
  const [calories, setCalories] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [carbs, setCarbs] = useState(0);
  const [carbsGoal, setCarbsGoal] = useState(250);
  const [fats, setFats] = useState(0);
  const [fatsGoal, setFatsGoal] = useState(65);
  const [protein, setProtein] = useState(0);
  const [proteinGoal, setProteinGoal] = useState(190);
  const [foodDescription, setFoodDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [mealType, setMealType] = useState<string>('other');
  const [meals, setMeals] = useState<IMeal[]>([]);

  // Exercise
  const [exerciseCalories, setExerciseCalories] = useState(0);
  const [exerciseGoal, setExerciseGoal] = useState(500);
  const [exerciseDescription, setExerciseDescription] = useState('');
  const [isAnalyzingExercise, setIsAnalyzingExercise] = useState(false);
  const [exerciseAnalysisError, setExerciseAnalysisError] = useState('');
  const [exercises, setExercises] = useState<IExercise[]>([]);

  // Profile
  const [userProfile, setUserProfile] = useState<IUserProfile | null>(null);

  // Weight
  const [todayWeight, setTodayWeight] = useState<number | null>(null);
  const [todayBodyFat, setTodayBodyFat] = useState<number | null>(null);
  const [weightSaved, setWeightSaved] = useState(false);

  // Summary
  const [summaryPeriod, setSummaryPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // AI
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Loading
  const [isLoading, setIsLoading] = useState(true);

  // Exercise tracking
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [exerciseCategory, setExerciseCategory] = useState<'cardio' | 'weight-training'>('cardio');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'abs' | 'legs'>('chest');

  // Streak
  const [streakLogs, setStreakLogs] = useState<IFitnessLog[]>([]);

  // Tab persistence
  const [activeTab, setActiveTab] = useState<string>('hydration');

  useEffect(() => {
    const saved = localStorage.getItem('fitnessAppActiveTab');
    if (saved) setActiveTab(saved);
  }, []);

  useEffect(() => {
    if (isMounted) localStorage.setItem('fitnessAppActiveTab', activeTab);
  }, [activeTab, isMounted]);

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const fetchUserProfile = useCallback(async (uid: string) => {
    try {
      const profile = await getProfile(uid);
      if (profile) {
        setUserProfile(profile);
        setDailyWaterGoal(profile.waterGoal || 4);
        setCalorieGoal(profile.dailyCalorieTarget || 2000);
        setExerciseGoal(profile.exerciseGoal || 500);
        if (profile.dailyProteinTarget) setProteinGoal(profile.dailyProteinTarget);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, []);

  const fetchTodayData = useCallback(async (uid: string) => {
    try {
      const log = await getTodayLog(uid, todayMidnight());
      if (log) {
        setWaterIntake(log.waterLiters || 0);
        setExerciseCalories(log.exerciseCalories || 0);
        setTodayWeight(log.weight ?? null);
        setTodayBodyFat(log.bodyFatPercentage ?? null);
      }
    } catch (error) {
      console.error('Error fetching today\'s data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMeals = useCallback(async (uid: string) => {
    try {
      const todayMeals = await getMeals(uid, todayMidnight());
      setMeals(todayMeals);
      // Compute totals from meals
      const totalCal = todayMeals.reduce((s, m) => s + m.calories, 0);
      const totalCarbs = todayMeals.reduce((s, m) => s + m.carbs, 0);
      const totalFats = todayMeals.reduce((s, m) => s + m.fats, 0);
      const totalProtein = todayMeals.reduce((s, m) => s + m.protein, 0);
      setCalories(totalCal);
      setCarbs(totalCarbs);
      setFats(totalFats);
      setProtein(totalProtein);
    } catch (error) {
      console.error('Error fetching meals:', error);
    }
  }, []);

  const fetchExercises = useCallback(async (uid: string, currentExerciseGoal?: number) => {
    try {
      const todayExercises = await getExercises(uid, todayMidnight());
      setExercises(todayExercises);
      const totalCal = todayExercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
      setExerciseCalories(totalCal);
      return totalCal;
    } catch (error) {
      console.error('Error fetching exercises:', error);
      return 0;
    }
  }, []);

  const fetchStreakData = useCallback(async (uid: string) => {
    try {
      const logs = await getStreakLogs(uid, 90);
      setStreakLogs(logs);
      return logs;
    } catch (error) {
      console.error('Error fetching streak data:', error);
      return [];
    }
  }, []);

  const fetchSummaryData = useCallback(
    async (uid: string, period: 'day' | 'week' | 'month' | 'year') => {
      setIsSummaryLoading(true);
      try {
        const logs = await getStreakLogs(uid, period === 'year' ? 365 : period === 'month' ? 31 : period === 'week' ? 7 : 1);
        const summary = computeSummaryFromLogs(logs, period);
        setSummaryData(summary);
      } catch (error) {
        console.error('Error computing summary:', error);
      } finally {
        setIsSummaryLoading(false);
      }
    },
    []
  );

  // Load all data once user is authenticated
  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    setIsLoading(true);
    Promise.all([
      fetchUserProfile(uid),
      fetchTodayData(uid),
      fetchStreakData(uid),
      fetchMeals(uid),
      fetchExercises(uid),
    ]);
  }, [currentUser, fetchUserProfile, fetchTodayData, fetchStreakData, fetchMeals, fetchExercises]);

  // Recompute summary when period changes
  useEffect(() => {
    if (!currentUser) return;
    fetchSummaryData(currentUser.uid, summaryPeriod);
    setAiAnalysis(null);
  }, [summaryPeriod, currentUser, fetchSummaryData]);

  // Midnight day-change reset
  useEffect(() => {
    if (!isMounted || !currentUser) return;

    let currentDateStr = new Date().toDateString();
    const refresh = () => {
      if (!currentUser) return;
      const uid = currentUser.uid;
      fetchTodayData(uid);
      fetchMeals(uid);
      fetchExercises(uid);
      fetchStreakData(uid);
      fetchSummaryData(uid, summaryPeriod);
      setDate(new Date());
    };

    const intervalId = setInterval(() => {
      const newDate = new Date().toDateString();
      if (newDate !== currentDateStr) {
        currentDateStr = newDate;
        refresh();
      }
    }, 60000);

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const ms = tomorrow.getTime() - now.getTime();

    const midnightTimer = setTimeout(() => {
      refresh();
      const recurringId = setInterval(refresh, 24 * 60 * 60 * 1000);
      return () => clearInterval(recurringId);
    }, ms);

    return () => {
      clearInterval(intervalId);
      clearTimeout(midnightTimer);
    };
  }, [isMounted, currentUser, summaryPeriod, fetchTodayData, fetchMeals, fetchExercises, fetchStreakData, fetchSummaryData]);

  // ─── Core update function ────────────────────────────────────────────────────

  const updateFitnessData = async (data: {
    waterLiters?: number;
    calories?: number;
    carbs?: number;
    fats?: number;
    protein?: number;
    exerciseCalories?: number;
    weight?: number;
    bodyFatPercentage?: number;
  }) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    try {
      const today = todayMidnight();

      const updatedWater = data.waterLiters ?? waterIntake;
      const updatedCal = data.calories ?? calories;
      const updatedEx = data.exerciseCalories ?? exerciseCalories;

      const { goalsCompleted, isStreakDay } = computeStreakStatus(
        updatedWater, dailyWaterGoal,
        updatedCal, calorieGoal,
        updatedEx, exerciseGoal,
      );

      await saveLog(uid, today, {
        waterLiters: updatedWater,
        waterGoal: dailyWaterGoal,
        calories: updatedCal,
        calorieGoal,
        carbs: data.carbs ?? carbs,
        carbsGoal,
        fats: data.fats ?? fats,
        fatsGoal,
        protein: data.protein ?? protein,
        proteinGoal,
        exerciseCalories: updatedEx,
        exerciseGoal,
        exercises: [],
        weight: data.weight,
        bodyFatPercentage: data.bodyFatPercentage,
        goalsCompleted,
        totalGoals: 3,
        isStreakDay,
        date: today,
      });

      // Refresh streak/summary
      fetchStreakData(uid);
      fetchSummaryData(uid, summaryPeriod);

      // Sync profile if weight changed
      if (data.weight !== undefined || data.bodyFatPercentage !== undefined) {
        const profileUpdate: Partial<IUserProfile> = {};
        if (data.weight !== undefined) profileUpdate.currentWeight = data.weight;
        if (data.bodyFatPercentage !== undefined) profileUpdate.bodyFatPercentage = data.bodyFatPercentage;
        await saveProfile(uid, profileUpdate);
        fetchUserProfile(uid);
      }
    } catch (error) {
      console.error('Error updating fitness data:', error);
    }
  };

  // ─── Water ──────────────────────────────────────────────────────────────────

  const addWater = () => {
    const next = waterIntake + 0.25;
    setWaterIntake(next);
    updateFitnessData({ waterLiters: next });
  };

  const removeWater = () => {
    const next = Math.max(waterIntake - 0.25, 0);
    setWaterIntake(next);
    updateFitnessData({ waterLiters: next });
  };

  // ─── Meals ──────────────────────────────────────────────────────────────────

  const analyzeFood = async () => {
    if (!foodDescription.trim() || !currentUser) {
      setAnalysisError('Please enter a food description');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const res = await fetch('/api/diet/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodDescription }),
      });
      const result = await res.json();

      if (result.success) {
        const { calories: cal, carbs: c, fats: f, protein: p } = result.data;
        await addMeal(currentUser.uid, {
          description: foodDescription,
          mealType: mealType as IMeal['mealType'],
          calories: cal,
          carbs: c,
          fats: f,
          protein: p,
          isAIAnalyzed: true,
          date: new Date(),
          timestamp: new Date(),
        });

        await fetchMeals(currentUser.uid);
        // Update fitness log with new totals (fetchMeals updates state)
        const newCal = calories + cal;
        const newCarbs = carbs + c;
        const newFats = fats + f;
        const newProtein = protein + p;
        updateFitnessData({ calories: newCal, carbs: newCarbs, fats: newFats, protein: newProtein });
        setFoodDescription('');
      } else {
        setAnalysisError(result.error || 'Failed to analyze food');
      }
    } catch {
      setAnalysisError('Network error. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    if (!currentUser) return;
    try {
      await deleteMeal(currentUser.uid, id);
      await fetchMeals(currentUser.uid);
      updateFitnessData({ calories, carbs, fats, protein });
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  // ─── Exercises ──────────────────────────────────────────────────────────────

  const analyzeExercise = async () => {
    if (!exerciseDescription.trim() || !currentUser) {
      setExerciseAnalysisError('Please enter an exercise description');
      return;
    }
    setIsAnalyzingExercise(true);
    setExerciseAnalysisError('');
    try {
      const res = await fetch('/api/exercises/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseDescription }),
      });
      const result = await res.json();

      if (result.success) {
        const ex = result.data;
        const setsArray = [];
        if (ex.category === 'weight-training' && ex.sets && ex.reps) {
          for (let i = 1; i <= ex.sets; i++) {
            setsArray.push({ setNumber: i, weight: ex.weight || 0, reps: ex.reps, completed: true });
          }
        }

        await addExercise(currentUser.uid, {
          name: ex.name,
          category: ex.category,
          muscleGroup: ex.muscleGroup,
          sets: setsArray,
          duration: ex.duration,
          distance: ex.distance,
          caloriesBurned: ex.caloriesBurned,
          notes: ex.notes,
          isAIAnalyzed: true,
          description: exerciseDescription,
          date: new Date(),
        });

        const newTotal = await fetchExercises(currentUser.uid);
        updateFitnessData({ exerciseCalories: newTotal });
        setExerciseDescription('');
      } else {
        setExerciseAnalysisError(result.error || 'Failed to analyze exercise');
      }
    } catch {
      setExerciseAnalysisError('Network error. Please try again.');
    } finally {
      setIsAnalyzingExercise(false);
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (!currentUser) return;
    try {
      await deleteExercise(currentUser.uid, id);
      const newTotal = await fetchExercises(currentUser.uid);
      updateFitnessData({ exerciseCalories: newTotal });
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  const saveQuickAddExercise = async (
    exerciseName: string,
    category: 'cardio' | 'weight-training',
    duration?: number,
    sets?: number,
    reps?: string,
    muscleGroup?: string,
    weight?: number,
    distance?: number,
  ) => {
    if (!currentUser) return;
    try {
      const setsArray = [];
      if (category === 'weight-training' && sets && reps) {
        const repsNum = parseInt(reps.split('-')[0]) || 10;
        for (let i = 1; i <= sets; i++) {
          setsArray.push({ setNumber: i, weight: weight || 0, reps: repsNum, completed: true });
        }
      }

      await addExercise(currentUser.uid, {
        name: exerciseName,
        category,
        muscleGroup: muscleGroup as IExercise['muscleGroup'],
        sets: setsArray,
        duration,
        distance,
        caloriesBurned: duration ? duration * 8 : sets ? sets * 15 : 0,
        isAIAnalyzed: false,
        date: new Date(),
      });

      const newTotal = await fetchExercises(currentUser.uid);
      updateFitnessData({ exerciseCalories: newTotal });
    } catch (error) {
      console.error('Error saving quick-add exercise:', error);
    }
  };

  const toggleExercise = (id: string) => {
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Summary helpers ─────────────────────────────────────────────────────────

  const getSummaryData = (period: 'day' | 'week' | 'month' | 'year'): SummaryData => {
    if (summaryData && summaryData.period === period) return summaryData;
    return {
      period,
      water: {
        consumed: waterIntake,
        goal: dailyWaterGoal,
        percentage: Math.round((waterIntake / dailyWaterGoal) * 100),
      },
      calories: {
        consumed: calories,
        goal: calorieGoal,
        percentage: Math.round((calories / calorieGoal) * 100),
      },
      exercise: {
        calories: exerciseCalories,
        goal: exerciseGoal,
        percentage: Math.round((exerciseCalories / exerciseGoal) * 100),
      },
      totalDays: 1,
    };
  };

  // ─── AI Analysis ─────────────────────────────────────────────────────────────

  const fetchAIAnalysis = async () => {
    if (!currentUser) return;
    setIsAnalyzingAI(true);
    setAiAnalysis(null);
    try {
      const sd = getSummaryData(summaryPeriod);
      const res = await fetch('/api/fitness/summary/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: sd, period: summaryPeriod }),
      });
      const result = await res.json();
      if (result.success) setAiAnalysis(result.data.analysis);
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // ─── Export (client-side) ────────────────────────────────────────────────────

  const exportCSV = async () => {
    if (!currentUser) return;
    setIsExporting(true);
    try {
      const sd = getSummaryData(summaryPeriod);
      const rows = [
        ['Period', 'Water (L)', 'Water Goal (L)', 'Calories', 'Calorie Goal', 'Exercise Cal', 'Exercise Goal', 'Days'],
        [
          sd.period,
          sd.water.consumed.toFixed(2),
          (sd.water.goal * sd.totalDays).toFixed(2),
          sd.calories.consumed,
          sd.calories.goal * sd.totalDays,
          sd.exercise.calories,
          sd.exercise.goal * sd.totalDays,
          sd.totalDays,
        ],
      ];
      const csv = rows.map((r) => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness-report-${summaryPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportJSON = async () => {
    if (!currentUser) return;
    setIsExporting(true);
    try {
      const sd = getSummaryData(summaryPeriod);
      const blob = new Blob([JSON.stringify({ summary: sd, exportedAt: new Date().toISOString() }, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness-report-${summaryPeriod}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting JSON:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // ─── Auth ────────────────────────────────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Reset all state
      setCurrentUser(null);
      setWaterIntake(0);
      setCalories(0);
      setCarbs(0);
      setFats(0);
      setProtein(0);
      setExerciseCalories(0);
      setMeals([]);
      setExercises([]);
      setStreakLogs([]);
      setUserProfile(null);
      setSummaryData(null);
      setAiAnalysis(null);
      setTodayWeight(null);
      setTodayBodyFat(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // ─── Render: loading / sign-in ────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-primary/10 rounded-full">
                <Dumbbell className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl">Fitness Tracker</CardTitle>
              <CardDescription className="mt-1">Sign in to track your daily health goals</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" onClick={handleGoogleSignIn}>
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Main app ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 md:mb-12">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Fitness Tracker</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Monitor your daily health and fitness goals
              </p>
            </div>
            <div className="flex items-center gap-3">
              {currentUser.photoURL && (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-border"
                />
              )}
              <div className="text-sm hidden sm:block">
                <div className="font-medium">{currentUser.displayName}</div>
                <div className="text-muted-foreground text-xs">{currentUser.email}</div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto gap-1">
                <TabsTrigger value="hydration" className="text-xs sm:text-sm px-2 py-2">Hydration</TabsTrigger>
                <TabsTrigger value="diet" className="text-xs sm:text-sm px-2 py-2">Diet</TabsTrigger>
                <TabsTrigger value="exercise" className="text-xs sm:text-sm px-2 py-2">Exercise</TabsTrigger>
                <TabsTrigger value="weight" className="text-xs sm:text-sm px-2 py-2">Weight</TabsTrigger>
                <TabsTrigger value="streak" className="text-xs sm:text-sm px-2 py-2">Streak</TabsTrigger>
                <TabsTrigger value="summary" className="text-xs sm:text-sm px-2 py-2">Summary</TabsTrigger>
              </TabsList>

              {/* Hydration Tab */}
              <TabsContent value="hydration" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Droplet className="h-5 w-5 text-blue-500" />
                          Water Intake
                        </CardTitle>
                        <CardDescription>Track your daily water consumption</CardDescription>
                      </div>
                      {isMounted && !isLoading && (
                        <Badge variant={waterIntake >= dailyWaterGoal ? "default" : "secondary"}>
                          {waterIntake.toFixed(2)} / {dailyWaterGoal} L
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isMounted || isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading your water intake...</div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{Math.round((waterIntake / dailyWaterGoal) * 100)}%</span>
                          </div>
                          <Progress value={(waterIntake / dailyWaterGoal) * 100} className="h-3" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={addWater} disabled={waterIntake >= dailyWaterGoal}>
                            <Droplet className="h-4 w-4 mr-2" />
                            Add 250ml
                          </Button>
                          <Button variant="outline" onClick={removeWater} disabled={waterIntake === 0}>
                            Remove 250ml
                          </Button>
                          <Button variant="outline" onClick={() => { setWaterIntake(0); updateFitnessData({ waterLiters: 0 }); }}>
                            Reset
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {Array.from({ length: 16 }).map((_, i) => {
                            const threshold = (i + 1) * 0.25;
                            return (
                              <div
                                key={i}
                                className={`h-12 md:h-16 rounded-lg border-2 flex items-center justify-center transition-all ${
                                  waterIntake >= threshold ? "bg-blue-500/20 border-blue-500" : "bg-muted border-border"
                                }`}
                              >
                                {waterIntake >= threshold && <Droplet className="h-5 w-5 text-blue-500" />}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Diet Tab */}
              <TabsContent value="diet" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-green-500" />
                      Nutrition Tracking
                    </CardTitle>
                    <CardDescription>AI-powered food analysis with macros</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!isMounted || isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading your nutrition data...</div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Meal Type</label>
                          <MealTypeSelect value={mealType} onChange={setMealType} />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Describe your meal</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={foodDescription}
                              onChange={(e) => setFoodDescription(e.target.value)}
                              placeholder="e.g., 2 eggs, whole wheat toast, banana, coffee"
                              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                              onKeyPress={(e) => e.key === 'Enter' && analyzeFood()}
                              disabled={isAnalyzing}
                            />
                            <Button onClick={analyzeFood} disabled={isAnalyzing || !foodDescription.trim()}>
                              {isAnalyzing ? 'Analyzing...' : 'Add Food'}
                            </Button>
                          </div>
                          {analysisError && <div className="text-sm text-red-600">{analysisError}</div>}
                          <div className="text-xs text-muted-foreground">
                            Powered by Gemini AI — Enter any food description for automatic macro calculation
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: 'Calories', value: calories, goal: calorieGoal, unit: 'kcal' },
                            { label: 'Carbs', value: carbs, goal: carbsGoal, unit: 'g', fixed: 1 },
                            { label: 'Fats', value: fats, goal: fatsGoal, unit: 'g', fixed: 1 },
                            { label: 'Protein', value: protein, goal: proteinGoal, unit: 'g', fixed: 1 },
                          ].map(({ label, value, goal, unit, fixed }) => (
                            <Card key={label} className="p-4">
                              <div className="text-xs text-muted-foreground mb-1">{label}</div>
                              <div className="text-2xl font-bold">{fixed ? value.toFixed(fixed) : value}</div>
                              <div className="text-xs text-muted-foreground">/ {goal} {unit}</div>
                              <Progress value={(value / goal) * 100} className="h-1 mt-2" />
                            </Card>
                          ))}
                        </div>

                        <Card className="p-4 bg-slate-50 dark:bg-slate-900/50">
                          <div className="text-sm font-medium mb-3">Macro Distribution</div>
                          <div className="space-y-2">
                            {[
                              { name: 'Carbs', val: carbs, goal: carbsGoal },
                              { name: 'Fats', val: fats, goal: fatsGoal },
                              { name: 'Protein', val: protein, goal: proteinGoal },
                            ].map(({ name, val, goal }) => (
                              <div key={name} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{name}</span>
                                <span className="font-medium">{((val / goal) * 100).toFixed(0)}%</span>
                              </div>
                            ))}
                          </div>
                        </Card>

                        <div className="border-t pt-4">
                          <MealHistory meals={meals} onDelete={handleDeleteMeal} />
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => {
                            setCalories(0); setCarbs(0); setFats(0); setProtein(0);
                            updateFitnessData({ calories: 0, carbs: 0, fats: 0, protein: 0 });
                          }}
                          className="w-full"
                        >
                          Reset All Nutrition
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Exercise Tab */}
              <TabsContent value="exercise" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Dumbbell className="h-5 w-5 text-purple-500" />
                          Exercise Tracking
                        </CardTitle>
                        <CardDescription>AI-powered exercise logging or choose from presets</CardDescription>
                      </div>
                      {isMounted && !isLoading && (
                        <Badge variant={exerciseCalories >= exerciseGoal ? "default" : "secondary"}>
                          {exerciseCalories} / {exerciseGoal} cal
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isMounted || isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading your exercise data...</div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{Math.round((exerciseCalories / exerciseGoal) * 100)}%</span>
                          </div>
                          <Progress value={(exerciseCalories / exerciseGoal) * 100} className="h-3" />
                        </div>

                        <div className="space-y-3 border-b pb-4 mb-4">
                          <label className="text-sm font-medium">Describe your workout</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={exerciseDescription}
                              onChange={(e) => setExerciseDescription(e.target.value)}
                              placeholder="e.g., 3 sets of 10 reps bench press at 80kg, or 30 minute run 5km"
                              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                              onKeyPress={(e) => e.key === 'Enter' && analyzeExercise()}
                              disabled={isAnalyzingExercise}
                            />
                            <Button onClick={analyzeExercise} disabled={isAnalyzingExercise || !exerciseDescription.trim()}>
                              {isAnalyzingExercise ? 'Analyzing...' : 'Add Exercise'}
                            </Button>
                          </div>
                          {exerciseAnalysisError && <div className="text-sm text-red-600 dark:text-red-400">{exerciseAnalysisError}</div>}
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Powered by Gemini AI — Enter any exercise description for automatic tracking
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Dumbbell className="h-4 w-4" />
                            Quick Add Exercises
                          </h3>
                          <div className="flex gap-2">
                            <Button variant={exerciseCategory === 'cardio' ? 'default' : 'outline'} onClick={() => setExerciseCategory('cardio')} className="flex-1">
                              <Heart className="h-4 w-4 mr-2" />
                              Cardio
                            </Button>
                            <Button variant={exerciseCategory === 'weight-training' ? 'default' : 'outline'} onClick={() => setExerciseCategory('weight-training')} className="flex-1">
                              <Dumbbell className="h-4 w-4 mr-2" />
                              Weight Training
                            </Button>
                          </div>
                        </div>

                        {exerciseCategory === 'cardio' && (
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold">Cardio Exercises</h3>
                            <div className="grid grid-cols-1 gap-2">
                              {cardioExercises.map((exercise) => (
                                <CustomizableCardioItem
                                  key={exercise.id}
                                  name={exercise.name}
                                  defaultDuration={exercise.duration}
                                  defaultDistance={exercise.distance}
                                  isCompleted={completedExercises.has(exercise.id)}
                                  onAdd={async (duration, distance) => {
                                    const wasCompleted = completedExercises.has(exercise.id);
                                    toggleExercise(exercise.id);
                                    if (!wasCompleted) {
                                      await saveQuickAddExercise(exercise.name, 'cardio', duration, undefined, undefined, undefined, undefined, distance);
                                    }
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {exerciseCategory === 'weight-training' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {weightTrainingCategories.map((cat) => (
                                <Button
                                  key={cat.id}
                                  size="sm"
                                  variant={selectedMuscleGroup === cat.id ? 'default' : 'outline'}
                                  onClick={() => setSelectedMuscleGroup(cat.id)}
                                  className="flex flex-col h-auto py-2 px-2"
                                >
                                  <span className="text-lg mb-1">{cat.icon}</span>
                                  <span className="text-xs">{cat.name}</span>
                                </Button>
                              ))}
                            </div>

                            {weightTrainingCategories
                              .filter((c) => c.id === selectedMuscleGroup)
                              .map((cat) => (
                                <div key={cat.id} className="space-y-2">
                                  <h3 className="text-sm font-semibold">{cat.name} Exercises</h3>
                                  <div className="grid grid-cols-1 gap-2">
                                    {cat.exercises.map((exercise) => (
                                      <CustomizableExerciseItem
                                        key={exercise.id}
                                        name={exercise.name}
                                        defaultReps={exercise.reps}
                                        defaultSets={exercise.sets}
                                        defaultWeight={0}
                                        isCompleted={completedExercises.has(exercise.id)}
                                        onAdd={async (sets, reps, weight) => {
                                          const wasCompleted = completedExercises.has(exercise.id);
                                          toggleExercise(exercise.id);
                                          if (!wasCompleted) {
                                            await saveQuickAddExercise(exercise.name, 'weight-training', undefined, sets, reps, cat.id, weight);
                                          }
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}

                        <Button variant="outline" onClick={() => {
                          setExerciseCalories(0);
                          setCompletedExercises(new Set());
                          updateFitnessData({ exerciseCalories: 0 });
                        }} className="w-full">
                          Reset Daily Progress
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
                <div className="border-b pb-4">
                  <ExerciseHistory exercises={exercises} onDelete={handleDeleteExercise} />
                </div>
              </TabsContent>

              {/* Weight Tab */}
              <TabsContent value="weight" className="space-y-4">
                {userProfile ? (
                  <>
                    <WeightGraph uid={currentUser.uid} days={30} targetWeight={userProfile.targetWeight} />
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Scale className="h-5 w-5 text-purple-500" />
                          Today's Measurements
                        </CardTitle>
                        <CardDescription>Log your weight and body fat for today</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Weight (kg)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={todayWeight || ''}
                              onChange={(e) => { setTodayWeight(parseFloat(e.target.value) || null); setWeightSaved(false); }}
                              placeholder={userProfile.currentWeight.toString()}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                            {todayWeight && (
                              <div className="text-xs text-muted-foreground">
                                {todayWeight > userProfile.currentWeight ? '+' : ''}
                                {(todayWeight - userProfile.currentWeight).toFixed(1)} kg
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Body Fat (%)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={todayBodyFat || ''}
                              onChange={(e) => { setTodayBodyFat(parseFloat(e.target.value) || null); setWeightSaved(false); }}
                              placeholder={userProfile.bodyFatPercentage.toString()}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                            {todayBodyFat && (
                              <div className="text-xs text-muted-foreground">
                                {todayBodyFat > userProfile.bodyFatPercentage ? '+' : ''}
                                {(todayBodyFat - userProfile.bodyFatPercentage).toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          onClick={async () => {
                            if (!todayWeight || !currentUser) return;
                            const today = todayMidnight();
                            await saveWeightLog(currentUser.uid, today, {
                              date: today,
                              weight: todayWeight,
                              bodyFatPercentage: todayBodyFat || undefined,
                            });
                            await updateFitnessData({ weight: todayWeight, bodyFatPercentage: todayBodyFat || undefined });
                            setWeightSaved(true);
                          }}
                          disabled={!todayWeight}
                          className="w-full"
                        >
                          Save Today's Measurements
                        </Button>

                        {weightSaved && (
                          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                            <div className="text-sm font-semibold text-green-600">Progress Saved!</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Your weight log has been updated and profile synced.
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <div className="text-muted-foreground">Loading profile...</div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Streak Tab */}
              <TabsContent value="streak" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Heatmap</CardTitle>
                    <CardDescription>
                      Current month activity • Green = all goals • Yellow = partial • Gray = minimal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StreakCalendar logs={streakLogs} monthsToShow={1} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-500" />
                      Your Streak
                    </CardTitle>
                    <CardDescription>Complete all 3 daily goals to maintain your streak</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StreakStats logs={streakLogs} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                        Progress Summary
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        {(['day', 'week', 'month', 'year'] as const).map((p) => (
                          <Button
                            key={p}
                            size="sm"
                            variant={summaryPeriod === p ? 'default' : 'outline'}
                            onClick={() => setSummaryPeriod(p)}
                          >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <CardDescription>
                      Your {summaryPeriod === 'day' ? 'daily' : summaryPeriod === 'week' ? 'weekly' : summaryPeriod === 'month' ? 'monthly' : 'yearly'} fitness overview
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isSummaryLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-3">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" />
                          <p className="text-sm text-muted-foreground">Loading summary...</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {[
                          { icon: <Droplet className="h-5 w-5 text-blue-500" />, label: 'Water Intake', key: 'water' as const, unit: 'L', color: 'blue' },
                          { icon: <Utensils className="h-5 w-5 text-green-500" />, label: 'Calorie Intake', key: 'calories' as const, unit: 'kcal', color: 'green' },
                          { icon: <Dumbbell className="h-5 w-5 text-purple-500" />, label: 'Exercise Calories', key: 'exercise' as const, unit: 'cal', color: 'purple' },
                        ].map(({ icon, label, key, unit }) => {
                          const sd = getSummaryData(summaryPeriod);
                          const section = sd[key];
                          const consumed = key === 'exercise' ? (section as SummaryData['exercise']).calories : (section as SummaryData['water'] | SummaryData['calories']).consumed;
                          const goal = section.goal * sd.totalDays;
                          const pct = section.percentage;
                          return (
                            <div key={key} className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {icon}
                                  <h3 className="font-semibold">{label}</h3>
                                </div>
                                <Badge variant={pct >= 100 ? "default" : "secondary"}>{pct}%</Badge>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{key === 'exercise' ? 'Burned' : 'Consumed'}</span>
                                  <span className="font-medium">
                                    {typeof consumed === 'number' && key === 'water'
                                      ? `${consumed.toFixed(2)} / ${goal.toFixed(2)} ${unit}`
                                      : `${Math.round(consumed).toLocaleString()} / ${Math.round(goal).toLocaleString()} ${unit}`}
                                  </span>
                                </div>
                                <Progress value={pct} className="h-2" />
                              </div>
                            </div>
                          );
                        })}

                        <div className="pt-4 border-t text-center space-y-2">
                          <div className="text-4xl font-bold text-primary">
                            {Math.round(
                              (getSummaryData(summaryPeriod).water.percentage +
                                getSummaryData(summaryPeriod).calories.percentage +
                                getSummaryData(summaryPeriod).exercise.percentage) / 3
                            )}%
                          </div>
                          <p className="text-sm text-muted-foreground">Overall completion</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                          <div className="text-center space-y-1 p-3 bg-blue-500/10 rounded-lg">
                            <div className="text-xl sm:text-2xl font-bold text-blue-500">
                              {getSummaryData(summaryPeriod).water.consumed.toFixed(1)}
                            </div>
                            <div className="text-xs text-muted-foreground">Liters</div>
                          </div>
                          <div className="text-center space-y-1 p-3 bg-green-500/10 rounded-lg">
                            <div className="text-xl sm:text-2xl font-bold text-green-500">
                              {(getSummaryData(summaryPeriod).calories.consumed / 1000).toFixed(1)}k
                            </div>
                            <div className="text-xs text-muted-foreground">Calories</div>
                          </div>
                          <div className="text-center space-y-1 p-3 bg-purple-500/10 rounded-lg">
                            <div className="text-xl sm:text-2xl font-bold text-purple-500">
                              {getSummaryData(summaryPeriod).exercise.calories}
                            </div>
                            <div className="text-xs text-muted-foreground">Calories Burned</div>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Export Report
                          </h3>
                          <div className="flex gap-2 flex-wrap">
                            <Button variant="outline" onClick={exportCSV} disabled={isExporting}>
                              {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                              Export CSV
                            </Button>
                            <Button variant="outline" onClick={exportJSON} disabled={isExporting}>
                              {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                              Export JSON
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* AI Analysis Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-pink-500" />
                        AI Fitness Analysis
                      </CardTitle>
                      <Button size="sm" onClick={fetchAIAnalysis} disabled={isAnalyzingAI}>
                        {isAnalyzingAI ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
                        ) : (
                          <><Sparkles className="h-4 w-4 mr-2" />Get Analysis</>
                        )}
                      </Button>
                    </div>
                    <CardDescription>Get personalized insights powered by Gemini AI</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isAnalyzingAI ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-3">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-pink-500" />
                          <p className="text-sm text-muted-foreground">Analyzing your fitness data...</p>
                        </div>
                      </div>
                    ) : aiAnalysis ? (
                      <div className="space-y-6">
                        <div className="text-center p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg">
                          <div className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                            {aiAnalysis.overallScore}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">Overall Score</p>
                        </div>

                        {aiAnalysis.highlights?.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2 text-green-600">
                              <Award className="h-4 w-4" />
                              Highlights
                            </h4>
                            <ul className="space-y-2">
                              {aiAnalysis.highlights.map((h, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                  <span>{h}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {aiAnalysis.areasToImprove?.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2 text-amber-600">
                              <AlertCircle className="h-4 w-4" />
                              Areas to Improve
                            </h4>
                            <ul className="space-y-2">
                              {aiAnalysis.areasToImprove.map((a, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                  <span>{a}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { icon: <Droplet className="h-4 w-4 text-blue-500" />, label: 'Hydration', text: aiAnalysis.hydrationInsight, bg: 'bg-blue-500/10' },
                            { icon: <Utensils className="h-4 w-4 text-green-500" />, label: 'Nutrition', text: aiAnalysis.nutritionInsight, bg: 'bg-green-500/10' },
                            { icon: <Dumbbell className="h-4 w-4 text-purple-500" />, label: 'Exercise', text: aiAnalysis.exerciseInsight, bg: 'bg-purple-500/10' },
                          ].map(({ icon, label, text, bg }) => (
                            <div key={label} className={`p-3 ${bg} rounded-lg`}>
                              <div className="flex items-center gap-2 mb-2">
                                {icon}
                                <span className="font-semibold text-sm">{label}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{text}</p>
                            </div>
                          ))}
                        </div>

                        <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-orange-500" />
                            <span className="font-semibold text-sm">Tip for the Period</span>
                          </div>
                          <p className="text-sm">{aiAnalysis.weeklyTip}</p>
                        </div>

                        <div className="p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg border border-pink-500/20 text-center">
                          <Sparkles className="h-5 w-5 text-pink-500 mx-auto mb-2" />
                          <p className="text-sm italic">&ldquo;{aiAnalysis.motivationalMessage}&rdquo;</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Brain className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">
                          Click &ldquo;Get Analysis&rdquo; to receive personalized insights about your fitness performance.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SidebarCalendar logs={streakLogs} selectedDate={date} onSelectDate={setDate} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Daily Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Water', value: `${dailyWaterGoal} L` },
                  { label: 'Calories', value: `${calorieGoal} kcal` },
                  { label: 'Exercise', value: `${exerciseGoal} cal` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Overall Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isMounted || isLoading ? (
                  <div className="text-center py-4 text-muted-foreground text-xs">Loading...</div>
                ) : (
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">
                      {Math.round(
                        ((waterIntake / dailyWaterGoal + calories / calorieGoal + exerciseCalories / exerciseGoal) / 3) * 100
                      )}%
                    </div>
                    <p className="text-xs text-muted-foreground">Average completion across all goals</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
