"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import {
  getProfile, saveProfile, getTodayLog, saveLog,
  getMeals, addMeal, deleteMeal,
  getExercises, addExercise, deleteExercise,
  saveWeightLog, getStreakLogs,
} from "@/lib/firestore";
import { IFitnessLog, IMeal, IExercise, IUserProfile, estimateBodyFat, calculateBMI, isProfileComplete } from "@/lib/types";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CustomizableExerciseItem } from "@/components/customizable-exercise-item";
import { CustomizableCardioItem } from "@/components/customizable-cardio-item";
import StreakStats from "@/components/streak-stats";
import StreakCalendar from "@/components/streak-calendar";
import { MealHistory, MealTypeSelect } from "@/components/meal-history";
import { ExerciseHistory } from "@/components/exercise-history";
import { WeightGraph } from "@/components/weight-graph";
import { cardioExercises, weightTrainingCategories } from "@/lib/exercises";
import { InstallPWABanner } from "@/components/install-pwa-banner";
import {
  IconDroplet, IconUtensils, IconDumbbell, IconScale, IconFlame, IconBarChart,
  IconSun, IconMoon, IconSparkle, IconBrain, IconSpinner, IconCheck, IconTrendingUp,
  IconFile, IconBraces, IconApple, IconShield, IconToday,
  IconGlass, IconBottle, IconJug,
  IconHeart, IconTarget, IconZap, IconRun,
  IconUser, IconLogOut, IconX, IconSave,
} from "@/components/icons";

/* ─── Design tokens ──────────────────────────────────────────────────────────
   Kinetic Obsidian — Hyper-Performance dark-first design system.
   Dark:  Obsidian foundation (#131313) with neon data accents.
   Light: Bright counterpart preserving accent personality.
*/
const DARK = {
  hydration: "#00daf3",   /* Electric Cyan — primary / hydration    */
  nutrition:  "#b9f600",  /* Lime          — nutrition / metabolic  */
  exercise:  "#ff6b00",   /* Kinetic Orange— workouts / effort      */
  streak:    "#ff2d7a",   /* Hyper Pink    — streak / urgency       */
  surface:   "#1c1b1b",   /* L1 card surface                        */
  surfaceHigh: "#2a2a2a", /* L1 card high                           */
  bg:        "#131313",   /* L0 obsidian base                       */
  bgHero:    "radial-gradient(ellipse at 50% 0%, #00daf314 0%, #131313 65%)",
  onSurface: "#e5e2e1",   /* on-surface                             */
  variant:   "#bac9cc",   /* on-surface-variant                     */
  outline:   "#222222",   /* border                                 */
  outlineVar:"#3b494c",   /* outline-variant                        */
  navBg:     "rgba(19,19,19,0.88)",
  headerBg:  "rgba(19,19,19,0.90)",
  inputBg:   "#201f1f",   /* surface-container                      */
} as const;

const LIGHT = {
  hydration: "#0891b2",   /* deeper cyan — readable on white          */
  nutrition:  "#4d7c0f",  /* olive lime                               */
  exercise:  "#ea580c",   /* orange                                   */
  streak:    "#be123c",   /* rose                                     */
  surface:   "#ffffff",
  surfaceHigh: "#eef2f7",
  bg:        "#e9edf2",   /* cool grey so white cards pop             */
  bgHero:    "radial-gradient(ellipse at 50% 0%, #0891b214 0%, #e9edf2 65%)",
  onSurface: "#0f172a",   /* slate-900                                */
  variant:   "#64748b",   /* slate-500                                */
  outline:   "#e2e8f0",   /* slate-200                                */
  outlineVar:"#cbd5e1",   /* slate-300                                */
  navBg:     "rgba(255,255,255,0.90)",
  headerBg:  "rgba(233,237,242,0.85)",
  inputBg:   "#f1f5f9",   /* slate-100                                */
} as const;

/* ─── Types ──────────────────────────────────────────────────────────────────*/

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

/* ─── Concentric ring widget ─────────────────────────────────────────────────*/

function ConcentricRings({
  water, waterGoal, calories, calorieGoal, exercise, exerciseGoal,
  colorHydration, colorNutrition, colorExercise, colorOnSurface, colorVariant,
}: {
  water: number; waterGoal: number;
  calories: number; calorieGoal: number;
  exercise: number; exerciseGoal: number;
  colorHydration: string; colorNutrition: string; colorExercise: string;
  colorOnSurface: string; colorVariant: string;
}) {
  const rings = [
    { r: 78, color: colorHydration, value: water,     max: waterGoal,    label: "Water" },
    { r: 60, color: colorNutrition,  value: calories,  max: calorieGoal,  label: "Kcal" },
    { r: 44, color: colorExercise,  value: exercise,  max: exerciseGoal, label: "Burn" },
  ];
  const overall = Math.round(rings.reduce((s, r) => s + Math.min((r.value / Math.max(r.max, 0.01)) * 100, 100), 0) / 3);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-52 h-52">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          {rings.map(({ r, color, value, max }) => {
            const circ = 2 * Math.PI * r;
            const pct  = Math.min((value / Math.max(max, 0.01)) * 100, 100);
            const dash = circ - (pct / 100) * circ;
            return (
              <g key={r}>
                {/* track */}
                <circle cx="100" cy="100" r={r} fill="none"
                  stroke={color} strokeOpacity="0.12" strokeWidth="12" />
                {/* progress */}
                <circle cx="100" cy="100" r={r} fill="none"
                  stroke={color} strokeWidth="12"
                  strokeDasharray={circ} strokeDashoffset={dash}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.8s ease", filter: `drop-shadow(0 0 10px ${color}55)` }} />
              </g>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className="font-display text-4xl leading-none" style={{ color: colorOnSurface }}>{overall}<span className="text-xl font-headline">%</span></span>
          <span className="font-label text-xs uppercase tracking-widest mt-1" style={{ color: colorVariant }}>Total Goal</span>
        </div>
      </div>
      {/* Legend */}
      <div className="flex gap-6">
        {rings.map(({ color, label, value, max }) => (
          <div key={label} className="text-center">
            <span className="font-label text-xs block uppercase tracking-wider" style={{ color }}>{label}</span>
            <span className="font-headline text-sm" style={{ color: colorOnSurface }}>
              {label === "Water" ? `${value.toFixed(1)}L` : `${Math.round(value)}`}
            </span>
            <span className="font-label text-[11px] block" style={{ color: colorVariant }}>
              / {label === "Water" ? `${max}L` : Math.round(max)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Gauge bar ──────────────────────────────────────────────────────────────*/

function Gauge({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / Math.max(max, 0.01)) * 100, 100);
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: `${color}1a` }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}55` }} />
    </div>
  );
}

/* ─── Muscle group icon lookup (replaces emoji in exercises.ts) ──────────────*/
const MUSCLE_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  heart:    IconHeart,
  shield:   IconShield,
  zap:      IconZap,
  dumbbell: IconDumbbell,
  target:   IconTarget,
  run:      IconRun,
  flame:    IconFlame,
};

/* ─── Bottom nav ─────────────────────────────────────────────────────────────*/

const NAV = [
  { id: "today",    Icon: IconToday,    label: "Today"    },
  { id: "train",    Icon: IconDumbbell, label: "Train"    },
  { id: "progress", Icon: IconBarChart, label: "Progress" },
] as const;

/* Map old persisted tab ids → new ids */
const TAB_REMAP: Record<string, string> = {
  hydration: "today", diet: "today", weight: "today",
  exercise: "train",
  streak: "progress", summary: "progress",
};

/* ─── Helpers ────────────────────────────────────────────────────────────────*/

function todayMidnight() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}

function computeStreak(w: number, wG: number, c: number, cG: number, e: number, eG: number) {
  const ok = [w >= wG, c >= cG * 0.9, e >= eG];
  return { goalsCompleted: ok.filter(Boolean).length, isStreakDay: ok.every(Boolean) };
}

function computeSummary(logs: IFitnessLog[], period: "day"|"week"|"month"|"year"): SummaryData {
  const now = new Date();
  let start = new Date(now);
  if      (period === "day")   { start.setHours(0,0,0,0); }
  else if (period === "week")  { start.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay()-1)); start.setHours(0,0,0,0); }
  else if (period === "month") { start.setDate(1); start.setHours(0,0,0,0); }
  else                         { start = new Date(now.getFullYear(), 0, 1); }
  const f   = logs.filter(l => new Date(l.date) >= start);
  const n   = Math.max(f.length, 1);
  const tw  = f.reduce((s,l) => s + (l.waterLiters || 0), 0);
  const twg = f.reduce((s,l) => s + (l.waterGoal || 4), 0) || 4;
  const tc  = f.reduce((s,l) => s + (l.calories || 0), 0);
  const tcg = f.reduce((s,l) => s + (l.calorieGoal || 2000), 0) || 2000;
  const te  = f.reduce((s,l) => s + (l.exerciseCalories || 0), 0);
  const teg = f.reduce((s,l) => s + (l.exerciseGoal || 500), 0) || 500;
  return {
    period,
    water:    { consumed: tw, goal: twg/n, percentage: Math.round((tw/Math.max(twg,0.01))*100) },
    calories: { consumed: tc, goal: tcg/n, percentage: Math.round((tc/Math.max(tcg,1))*100) },
    exercise: { calories: te, goal: teg/n, percentage: Math.round((te/Math.max(teg,1))*100) },
    totalDays: n,
  };
}

/* ─── Main component ─────────────────────────────────────────────────────────*/

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isMounted, setIsMounted]     = useState(false);
  const [isDark, setIsDark]           = useState(true);

  /* Persist + apply theme */
  useEffect(() => {
    const saved = localStorage.getItem("fitTheme");
    const dark  = saved ? saved === "dark" : true;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
    setIsMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("fitTheme", next ? "dark" : "light");
  };

  /* Dynamic color palette */
  const C = isDark ? DARK : LIGHT;

  useEffect(() => onAuthStateChanged(auth, u => { setCurrentUser(u); setAuthLoading(false); }), []);

  /* daily state */
  const [waterIntake,     setWaterIntake]     = useState(0);
  const [dailyWaterGoal,  setDailyWaterGoal]  = useState(4);
  const [calories,        setCalories]        = useState(0);
  const [calorieGoal,     setCalorieGoal]     = useState(2000);
  const [carbs,           setCarbs]           = useState(0);
  const [carbsGoal,       setCarbsGoal]       = useState(250);
  const [fats,            setFats]            = useState(0);
  const [fatsGoal,        setFatsGoal]        = useState(65);
  const [protein,         setProtein]         = useState(0);
  const [proteinGoal,     setProteinGoal]     = useState(190);
  const [exerciseCalories,setExerciseCalories]= useState(0);
  const [exerciseGoal,    setExerciseGoal]    = useState(500);
  const [todayWeight,     setTodayWeight]     = useState<number|null>(null);
  const [weightSaved,     setWeightSaved]     = useState(false);

  /* app state */
  const [meals,       setMeals]       = useState<IMeal[]>([]);
  const [exercises,   setExercises]   = useState<IExercise[]>([]);
  const [streakLogs,  setStreakLogs]  = useState<IFitnessLog[]>([]);
  const [userProfile, setUserProfile] = useState<IUserProfile|null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [activeTab,   setActiveTab]   = useState("hydration");

  /* profile settings modal */
  const [showProfile,    setShowProfile]    = useState(false);
  const [sheetClosing,   setSheetClosing]   = useState(false);
  const [profileSaving,  setProfileSaving]  = useState(false);
  const [pfHeight,        setPfHeight]        = useState("");
  const [pfAge,           setPfAge]           = useState("");
  const [pfGender,        setPfGender]        = useState<"male"|"female"|"">("");
  const [pfCurrentWeight, setPfCurrentWeight] = useState("");
  const [pfTargetWeight,  setPfTargetWeight]  = useState("");
  const [pfWaterGoal,    setPfWaterGoal]    = useState("");
  const [pfCalorieGoal,  setPfCalorieGoal]  = useState("");
  const [pfProteinGoal,  setPfProteinGoal]  = useState("");
  const [pfExerciseGoal, setPfExerciseGoal] = useState("");

  /* AI / summary */
  const [summaryPeriod,    setSummaryPeriod]    = useState<"day"|"week"|"month"|"year">("day");
  const [summaryData,      setSummaryData]      = useState<SummaryData|null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [aiAnalysis,       setAiAnalysis]       = useState<AIAnalysis|null>(null);
  const [isAnalyzingAI,    setIsAnalyzingAI]    = useState(false);

  /* input state */
  const [foodDescription,        setFoodDescription]       = useState("");
  const [isAnalyzing,            setIsAnalyzing]           = useState(false);
  const [analysisError,          setAnalysisError]         = useState("");
  const [mealType,               setMealType]              = useState("other");
  const [exerciseDescription,    setExerciseDescription]   = useState("");
  const [isAnalyzingExercise,    setIsAnalyzingExercise]   = useState(false);
  const [exerciseAnalysisError,  setExerciseAnalysisError] = useState("");
  const [completedExercises,     setCompletedExercises]    = useState<Set<string>>(new Set());
  const [exerciseCategory,       setExerciseCategory]      = useState<"cardio"|"weight-training">("cardio");
  const [selectedMuscleGroup,    setSelectedMuscleGroup]   = useState<"chest"|"back"|"shoulders"|"biceps"|"triceps"|"abs"|"legs">("chest");

  /* tab persistence + shortcut URL param (?tab=today) */
  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const raw      = params.get("tab") || localStorage.getItem("fitActiveTab") || "today";
    const valid    = ["today", "train", "progress"];
    const resolved = TAB_REMAP[raw] ?? raw;
    setActiveTab(valid.includes(resolved) ? resolved : "today");
  }, []);
  useEffect(() => { if (isMounted) localStorage.setItem("fitActiveTab", activeTab); }, [activeTab, isMounted]);

  /* ─── Data fetching ─────────────────────────────────────────────────────────*/

  const fetchUserProfile = useCallback(async (uid: string) => {
    let p = await getProfile(uid);
    if (!p) {
      // First sign-in: seed ONLY standard app goal targets — never fabricate
      // personal body data (height/age/gender/weight). Those come from onboarding.
      await saveProfile(uid, {
        dailyCalorieTarget: 2000,
        dailyProteinTarget: 150,
        waterGoal: 4,
        exerciseGoal: 500,
      });
      p = await getProfile(uid);
    }
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
    const logs = await getStreakLogs(uid, period === "year" ? 365 : period === "month" ? 31 : period === "week" ? 7 : 1);
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

  /* ─── Log update ─────────────────────────────────────────────────────────────*/

  const updateLog = useCallback(async (data: {
    waterLiters?: number; calories?: number; carbs?: number; fats?: number;
    protein?: number; exerciseCalories?: number; weight?: number; bodyFatPercentage?: number;
  }, cw = waterIntake, cc = calories, ce = exerciseCalories) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const today = todayMidnight();
    const w = data.waterLiters ?? cw;
    const c = data.calories    ?? cc;
    const e = data.exerciseCalories ?? ce;
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

  /* ─── Meals ─────────────────────────────────────────────────────────────────*/

  const analyzeFood = async () => {
    if (!foodDescription.trim() || !currentUser) return;
    setIsAnalyzing(true); setAnalysisError("");
    try {
      const r   = await fetch("/api/diet/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ foodDescription }) });
      const res = await r.json();
      if (res.success) {
        const { calories: cal, carbs: cb, fats: ft, protein: pr } = res.data;
        await addMeal(currentUser.uid, { description: foodDescription, mealType: mealType as IMeal["mealType"], calories: cal, carbs: cb, fats: ft, protein: pr, isAIAnalyzed: true, date: new Date(), timestamp: new Date() });
        await fetchMeals(currentUser.uid);
        updateLog({ calories: calories + cal, carbs: carbs + cb, fats: fats + ft, protein: protein + pr });
        setFoodDescription("");
      } else { setAnalysisError(res.error || "Failed to analyze"); }
    } catch { setAnalysisError("Network error. Try again."); }
    finally { setIsAnalyzing(false); }
  };

  const handleDeleteMeal = async (id: string) => {
    if (!currentUser) return;
    await deleteMeal(currentUser.uid, id);
    await fetchMeals(currentUser.uid);
  };

  /* ─── Exercises ─────────────────────────────────────────────────────────────*/

  const analyzeExercise = async () => {
    if (!exerciseDescription.trim() || !currentUser) return;
    setIsAnalyzingExercise(true); setExerciseAnalysisError("");
    try {
      const r   = await fetch("/api/exercises/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exerciseDescription }) });
      const res = await r.json();
      if (res.success) {
        const ex   = res.data;
        const sets = ex.category === "weight-training" && ex.sets && ex.reps
          ? Array.from({ length: ex.sets }, (_,i) => ({ setNumber: i+1, weight: ex.weight||0, reps: ex.reps, completed: true }))
          : [];
        await addExercise(currentUser.uid, { name: ex.name, category: ex.category, muscleGroup: ex.muscleGroup, sets, duration: ex.duration, distance: ex.distance, caloriesBurned: ex.caloriesBurned, isAIAnalyzed: true, description: exerciseDescription, date: new Date() });
        const total = await fetchExercises(currentUser.uid);
        updateLog({ exerciseCalories: total }, undefined, undefined, total);
        setExerciseDescription("");
      } else { setExerciseAnalysisError(res.error || "Failed"); }
    } catch { setExerciseAnalysisError("Network error."); }
    finally { setIsAnalyzingExercise(false); }
  };

  const handleDeleteExercise = async (id: string) => {
    if (!currentUser) return;
    await deleteExercise(currentUser.uid, id);
    const total = await fetchExercises(currentUser.uid);
    updateLog({ exerciseCalories: total }, undefined, undefined, total);
  };

  const saveQuickExercise = async (name: string, category: "cardio"|"weight-training", duration?: number, sets?: number, reps?: string, muscleGroup?: string, weight?: number, distance?: number) => {
    if (!currentUser) return;
    const setsArr = category === "weight-training" && sets && reps
      ? Array.from({ length: sets }, (_,i) => ({ setNumber: i+1, weight: weight||0, reps: parseInt(reps.split("-")[0])||10, completed: true }))
      : [];
    await addExercise(currentUser.uid, { name, category, muscleGroup: muscleGroup as IExercise["muscleGroup"], sets: setsArr, duration, distance, caloriesBurned: duration ? duration*8 : sets ? sets*15 : 0, isAIAnalyzed: false, date: new Date() });
    const total = await fetchExercises(currentUser.uid);
    updateLog({ exerciseCalories: total }, undefined, undefined, total);
  };

  const toggleExercise = (id: string) => setCompletedExercises(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  /* ─── Summary helpers ───────────────────────────────────────────────────────*/

  const getSd = () => summaryData && summaryData.period === summaryPeriod ? summaryData : {
    period: summaryPeriod,
    water:    { consumed: waterIntake, goal: dailyWaterGoal, percentage: Math.round((waterIntake/dailyWaterGoal)*100) },
    calories: { consumed: calories, goal: calorieGoal, percentage: Math.round((calories/calorieGoal)*100) },
    exercise: { calories: exerciseCalories, goal: exerciseGoal, percentage: Math.round((exerciseCalories/exerciseGoal)*100) },
    totalDays: 1,
  };

  const fetchAIAnalysis = async () => {
    if (!currentUser) return;
    setIsAnalyzingAI(true); setAiAnalysis(null);
    try {
      const r = await fetch("/api/fitness/summary/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ summary: getSd(), period: summaryPeriod }) });
      const res = await r.json();
      if (res.success) setAiAnalysis(res.data.analysis);
    } catch { /* silent */ }
    finally { setIsAnalyzingAI(false); }
  };

  const exportData = (format: "csv"|"json") => {
    const sd = getSd();
    const content = format === "csv"
      ? `Period,Water(L),Calories,Exercise Cal\n${sd.period},${sd.water.consumed.toFixed(2)},${sd.calories.consumed},${sd.exercise.calories}`
      : JSON.stringify({ summary: sd, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([content], { type: format === "csv" ? "text/csv" : "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `fitness-${sd.period}-${new Date().toISOString().split("T")[0]}.${format}` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  /* ─── Auth ───────────────────────────────────────────────────────────────────*/

  const handleSignIn  = () => signInWithPopup(auth, googleProvider).catch(console.error);
  const handleSignOut = async () => {
    await signOut(auth);
    setWaterIntake(0); setCalories(0); setCarbs(0); setFats(0); setProtein(0); setExerciseCalories(0);
    setMeals([]); setExercises([]); setStreakLogs([]);
    setUserProfile(null); setSummaryData(null); setAiAnalysis(null); setTodayWeight(null);
    setShowProfile(false);
  };

  const openProfile = () => {
    if (!userProfile) return;
    setPfHeight(userProfile.height ? String(userProfile.height) : "");
    setPfAge(userProfile.age ? String(userProfile.age) : "");
    setPfGender(userProfile.gender ?? "");
    setPfCurrentWeight(userProfile.currentWeight ? String(userProfile.currentWeight) : "");
    setPfTargetWeight(userProfile.targetWeight ? String(userProfile.targetWeight) : "");
    setPfWaterGoal(String(dailyWaterGoal));
    setPfCalorieGoal(String(calorieGoal));
    setPfProteinGoal(String(proteinGoal));
    setPfExerciseGoal(String(exerciseGoal));
    setSheetClosing(false);
    setShowProfile(true);
  };

  const closeProfile = () => {
    setSheetClosing(true);
    setTimeout(() => { setShowProfile(false); setSheetClosing(false); }, 240);
  };

  const saveProfileSettings = async () => {
    if (!currentUser) return;
    setProfileSaving(true);
    // Only persist fields the user actually filled in — no fabricated fallbacks.
    const update: Partial<IUserProfile> = {};
    if (pfHeight.trim())        update.height        = parseFloat(pfHeight);
    if (pfAge.trim())           update.age           = parseInt(pfAge);
    if (pfGender)               update.gender        = pfGender;
    if (pfCurrentWeight.trim()) update.currentWeight = parseFloat(pfCurrentWeight);
    if (pfTargetWeight.trim())  update.targetWeight  = parseFloat(pfTargetWeight);
    if (pfWaterGoal.trim())     update.waterGoal          = parseFloat(pfWaterGoal);
    if (pfCalorieGoal.trim())   update.dailyCalorieTarget = parseInt(pfCalorieGoal);
    if (pfProteinGoal.trim())   update.dailyProteinTarget = parseInt(pfProteinGoal);
    if (pfExerciseGoal.trim())  update.exerciseGoal       = parseInt(pfExerciseGoal);
    await saveProfile(currentUser.uid, update);
    await fetchUserProfile(currentUser.uid);
    setProfileSaving(false);
    closeProfile();
  };

  /* ─── Splash / sign-in ───────────────────────────────────────────────────────*/

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <div className="flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center glass-card" style={{ color: DARK.hydration }}>
          <IconDumbbell size={40} />
        </div>
        <IconSpinner size={20} className="animate-spin" style={{ color: DARK.hydration }} />
      </div>
    </div>
  );

  if (!currentUser) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 px-5"
      style={{ background: C.bgHero }}>

      {/* Theme toggle on sign-in screen — pushed below status bar */}
      <button onClick={toggleTheme}
        className="absolute right-5 w-10 h-10 rounded-full glass-card flex items-center justify-center active:scale-90 transition-transform"
        style={{ color: C.variant, top: "max(env(safe-area-inset-top), 1.25rem)" }}>
        {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
      </button>

      <div className="text-center space-y-4">
        <div className="w-24 h-24 rounded-[28px] glass-card flex items-center justify-center mx-auto"
          style={{ boxShadow: `0 0 40px ${C.hydration}30`, color: C.hydration }}>
          <IconDumbbell size={48} />
        </div>
        <h1 className="font-display text-4xl" style={{ color: C.onSurface }}>FitTrack</h1>
        <p className="font-body text-sm max-w-xs mx-auto" style={{ color: C.variant }}>
          Kinetic Performance — track hydration, nutrition &amp; training in one place
        </p>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-2 max-w-xs">
        {[
          { Icon: IconDroplet,  label: "Hydration",    color: C.hydration },
          { Icon: IconApple,    label: "AI Nutrition",  color: C.nutrition },
          { Icon: IconDumbbell, label: "Workouts",      color: C.exercise },
          { Icon: IconFlame,    label: "Streaks",       color: C.exercise },
        ].map(({ Icon, label, color }) => (
          <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-headline glass-card"
            style={{ color, border: `1px solid ${color}30` }}>
            <Icon size={13} /> {label}
          </div>
        ))}
      </div>

      <button
        onClick={handleSignIn}
        className="w-full max-w-xs h-14 rounded-2xl flex items-center justify-center gap-3 font-headline text-base transition-all active:scale-95"
        style={{ background: C.hydration, color: "#001f24", boxShadow: `0 0 30px ${C.hydration}40` }}>
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#001f24" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#001f24" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#001f24" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#001f24" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <p className="font-label text-xs flex items-center gap-1.5" style={{ color: C.variant }}>
        <IconShield size={13} /> Your data is private and encrypted
      </p>
    </div>
  );

  /* ─── Main app ───────────────────────────────────────────────────────────────*/

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: C.bg, color: C.onSurface }}>

      {/* ── Ambient glow background (Kinetic Obsidian) ── */}
      {isDark && (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute rounded-full" style={{ top: "-10%", right: "-10%", width: "50%", height: "50%", background: `${C.hydration}0d`, filter: "blur(120px)" }} />
          <div className="absolute rounded-full" style={{ bottom: "-5%", left: "-10%", width: "40%", height: "40%", background: `${C.nutrition}0a`, filter: "blur(100px)" }} />
        </div>
      )}

      {/* ── Top app bar ── */}
      <header className="sticky top-0 z-30 px-5 py-3 flex items-center justify-between glass-overlay"
        style={{
          borderBottom: `1px solid ${C.outlineVar}`,
          paddingTop: "max(env(safe-area-inset-top), 0.75rem)",
        }}>
        <div className="flex items-center gap-3">
          <button onClick={openProfile} className="active:scale-90 transition-transform" aria-label="Open profile">
            {currentUser.photoURL
              ? <img src={currentUser.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" style={{ border: `1px solid ${C.outline}` }} />
              : <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center font-headline">
                  {currentUser.displayName?.[0] ?? "U"}
                </div>
            }
          </button>
          <div>
            <div className="font-label text-xs uppercase tracking-widest" style={{ color: C.variant }}>{greeting}</div>
            <div className="font-headline text-base truncate max-w-[140px]">{currentUser.displayName?.split(" ")[0] ?? "Athlete"}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center glass-card active:scale-90 transition-transform"
            style={{ color: C.variant }}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
            {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
          </button>
          <div className="text-right">
            <div className="font-label text-xs uppercase tracking-widest" style={{ color: C.variant }}>Today</div>
            <div className="font-display text-lg" style={{ color: C.hydration }}>
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          </div>
        </div>
      </header>

      {/* ── Daily activity hero ── */}
      <div className="px-5 pt-6 pb-2 flex flex-col items-center gap-1"
        style={{ background: isDark ? undefined : `linear-gradient(180deg, #0099bb08 0%, transparent 100%)` }}>
        {isLoading ? (
          <div className="h-52 flex items-center justify-center">
            <IconSpinner size={24} className="animate-spin" style={{ color: C.hydration }} />
          </div>
        ) : (
          <ConcentricRings
            water={waterIntake} waterGoal={dailyWaterGoal}
            calories={calories} calorieGoal={calorieGoal}
            exercise={exerciseCalories} exerciseGoal={exerciseGoal}
            colorHydration={C.hydration} colorNutrition={C.nutrition}
            colorExercise={C.exercise} colorOnSurface={C.onSurface} colorVariant={C.variant} />
        )}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "max(calc(env(safe-area-inset-bottom) + 7rem), 7rem)" }}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>

          {/* ── TODAY (Hydration + Nutrition + Body) ──────────────────────── */}
          <TabsContent value="today" className="mt-0 px-5 pt-2 space-y-5 max-w-lg mx-auto">

            {/* ── Water ── */}
            <div className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-sm flex items-center gap-2" style={{ color: C.onSurface }}>
                  <IconDroplet size={15} style={{ color: C.hydration }} /> Hydration
                  <span className="font-label text-xs font-normal" style={{ color: C.variant }}>{waterIntake.toFixed(1)}L / {dailyWaterGoal}L</span>
                </h3>
                <button onClick={() => { setWaterIntake(0); updateLog({ waterLiters: 0 }, 0); }}
                  className="font-label text-xs px-2.5 py-1 rounded-lg glass-card active:scale-90 transition-transform"
                  style={{ color: C.variant, border: `1px solid ${C.outline}` }}>Reset</button>
              </div>

              {/* gauge */}
              <div className="h-3 rounded-full overflow-hidden" style={{ background: `${C.hydration}1a` }}>
                <div className="h-full rounded-full transition-all duration-700 relative"
                  style={{ width: `${Math.min((waterIntake/dailyWaterGoal)*100,100)}%`, background: C.hydration, boxShadow: `0 0 10px ${C.hydration}70` }}>
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                </div>
              </div>

              {/* Quick add + remove — 4 equal buttons with professional SVG icons */}
              <div className="grid grid-cols-4 gap-2">
                {([
                  { Icon: IconGlass,  label: "Glass",  sub: "+250ml", amount: 0.25 },
                  { Icon: IconBottle, label: "Bottle", sub: "+500ml", amount: 0.5  },
                  { Icon: IconJug,    label: "Jug",    sub: "+1 L",   amount: 1    },
                ] as const).map(({ Icon, label, sub, amount }) => (
                  <button key={label}
                    aria-label={`Add ${sub} water`}
                    onClick={() => { const n = Math.min(waterIntake + amount, dailyWaterGoal * 2); setWaterIntake(n); updateLog({ waterLiters: n }, n); }}
                    className="rounded-xl py-3 flex flex-col items-center gap-1 active:scale-95 transition-all"
                    style={{ background: `${C.hydration}15`, border: `1px solid ${C.hydration}35` }}>
                    <Icon size={18} style={{ color: C.hydration }} />
                    <span className="font-label text-[11px] leading-tight" style={{ color: C.variant }}>{sub}</span>
                  </button>
                ))}
                <button
                  aria-label="Remove 250ml water"
                  onClick={() => { const n = Math.max(waterIntake - 0.25, 0); setWaterIntake(n); updateLog({ waterLiters: n }, n); }}
                  className="rounded-xl py-3 flex flex-col items-center gap-1 active:scale-95 transition-all"
                  style={{ background: `${C.outline}30`, border: `1px solid ${C.outline}` }}>
                  <IconDroplet size={18} style={{ color: C.variant }} />
                  <span className="font-label text-[11px] leading-tight" style={{ color: C.variant }}>−250ml</span>
                </button>
              </div>

              {/* Cup progress dots */}
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: Math.ceil(dailyWaterGoal / 0.25) }).map((_, i) => {
                  const t = (i + 1) * 0.25;
                  return (
                    <div key={i} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        background: waterIntake >= t ? `${C.hydration}25` : `${C.surface}60`,
                        border: `1px solid ${waterIntake >= t ? C.hydration + "60" : C.outline}`,
                      }}>
                      {waterIntake >= t && <IconDroplet size={13} style={{ color: C.hydration }} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Nutrition ── */}
            <div className="space-y-3">
              <h3 className="font-headline text-sm flex items-center gap-2" style={{ color: C.onSurface }}>
                <IconUtensils size={15} style={{ color: C.nutrition }} /> Nutrition
              </h3>

              {/* Macro bars */}
              <div className="glass-card rounded-xl p-4 space-y-4">
                {[
                  { label: "Calories", value: calories, goal: calorieGoal, unit: "kcal", color: C.nutrition },
                  { label: "Protein",  value: protein,  goal: proteinGoal, unit: "g",    color: C.hydration },
                  { label: "Carbs",    value: carbs,    goal: carbsGoal,   unit: "g",    color: C.nutrition },
                  { label: "Fats",     value: fats,     goal: fatsGoal,    unit: "g",    color: C.exercise },
                ].map(({ label, value, goal, unit, color }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="font-body text-sm" style={{ color: C.onSurface }}>{label}</span>
                      <span className="font-label text-xs" style={{ color: C.variant }}>{typeof value === "number" ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}{unit} / {goal}{unit}</span>
                    </div>
                    <Gauge value={value} max={goal} color={color} />
                  </div>
                ))}
              </div>

              {/* AI food input */}
              <div className="glass-card rounded-xl p-4 space-y-3">
                <div>
                  <label className="font-label text-xs uppercase tracking-widest" style={{ color: C.variant }}>Meal Type</label>
                  <div className="mt-2"><MealTypeSelect value={mealType} onChange={setMealType} /></div>
                </div>
                <div>
                  <label className="font-label text-xs uppercase tracking-widest" style={{ color: C.variant }}>Describe your meal</label>
                  <div className="flex gap-2 mt-2">
                    <input type="text" value={foodDescription} onChange={e => setFoodDescription(e.target.value)}
                      placeholder="e.g. 2 eggs, toast, coffee…" disabled={isAnalyzing}
                      onKeyDown={e => e.key === "Enter" && analyzeFood()}
                      className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: C.inputBg, border: `1px solid ${C.outline}`, color: C.onSurface }} />
                    <button onClick={analyzeFood} disabled={isAnalyzing || !foodDescription.trim()}
                      className="px-4 rounded-xl font-headline text-sm active:scale-95 transition-all disabled:opacity-40"
                      style={{ background: C.nutrition, color: "#102000" }}>
                      {isAnalyzing ? <IconSpinner size={16} className="animate-spin" /> : <><IconSparkle size={14} className="inline mr-1" />AI</>}
                    </button>
                  </div>
                  {analysisError && <p className="text-xs mt-1" style={{ color: "#ffb4ab" }}>{analysisError}</p>}
                </div>
              </div>

              {/* Meal history */}
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <span className="font-headline text-sm" style={{ color: C.onSurface }}>Today's Meals</span>
                  <button className="font-label text-xs active:opacity-70" style={{ color: C.variant }}
                    onClick={() => { setCalories(0); setCarbs(0); setFats(0); setProtein(0); updateLog({ calories: 0, carbs: 0, fats: 0, protein: 0 }); }}>Clear all</button>
                </div>
                <div className="px-4 pb-4"><MealHistory meals={meals} onDelete={handleDeleteMeal} /></div>
              </div>
            </div>

            {/* ── Body Metrics ── */}
            <div className="space-y-3">
              <h3 className="font-headline text-sm flex items-center gap-2" style={{ color: C.onSurface }}>
                <IconScale size={15} style={{ color: C.hydration }} /> Body Metrics
              </h3>
              {!userProfile ? (
                <div className="glass-card rounded-xl p-8 text-center space-y-2" style={{ color: C.variant }}>
                  <IconSpinner size={20} className="animate-spin mx-auto" style={{ color: C.hydration }} />
                  <p className="font-body text-sm">Loading…</p>
                </div>
              ) : !isProfileComplete(userProfile) ? (
                <div className="glass-card rounded-xl p-6 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${C.hydration}15` }}>
                    <IconScale size={22} style={{ color: C.hydration }} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-headline text-sm" style={{ color: C.onSurface }}>Complete your profile</p>
                    <p className="font-body text-xs" style={{ color: C.variant }}>Add your height &amp; weight to unlock BMI and body-fat tracking. Nothing is assumed.</p>
                  </div>
                  <button onClick={openProfile}
                    className="w-full h-11 rounded-xl font-headline text-sm active:scale-95 transition-all"
                    style={{ background: C.hydration, color: "#001f24" }}>
                    Set up profile
                  </button>
                </div>
              ) : (() => {
                const effWeight = todayWeight || userProfile.currentWeight!;
                const estBF = estimateBodyFat(effWeight, userProfile.height!, userProfile.age, userProfile.gender || undefined);
                const bmi   = calculateBMI(effWeight, userProfile.height!);
                return (
                <>
                  <WeightGraph uid={currentUser.uid} days={30} targetWeight={userProfile.targetWeight} />
                  <div className="glass-card rounded-xl p-4 space-y-4">
                    <div className="space-y-1.5">
                      <label className="font-label text-xs uppercase tracking-widest" style={{ color: C.variant }}>Weight (kg)</label>
                      <input type="number" step="0.1" inputMode="decimal" value={todayWeight || ""}
                        onChange={e => { setTodayWeight(parseFloat(e.target.value) || 0); setWeightSaved(false); }}
                        placeholder={userProfile.currentWeight!.toString()}
                        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                        style={{ background: C.inputBg, border: `1px solid ${C.outline}`, color: C.onSurface }} />
                    </div>

                    {/* Auto-calculated metrics from height + weight */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl p-3" style={{ background: C.inputBg, border: `1px solid ${C.outlineVar}` }}>
                        <div className="font-label text-[11px] uppercase tracking-widest" style={{ color: C.variant }}>Body Fat</div>
                        <div className="font-display text-2xl mt-0.5" style={{ color: C.hydration }}>{estBF}<span className="text-sm font-headline">%</span></div>
                        <div className="font-label text-[10px] mt-0.5" style={{ color: C.variant }}>est. from BMI</div>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: C.inputBg, border: `1px solid ${C.outlineVar}` }}>
                        <div className="font-label text-[11px] uppercase tracking-widest" style={{ color: C.variant }}>BMI</div>
                        <div className="font-display text-2xl mt-0.5" style={{ color: C.nutrition }}>{bmi.toFixed(1)}</div>
                        <div className="font-label text-[10px] mt-0.5" style={{ color: C.variant }}>
                          {bmi < 18.5 ? "underweight" : bmi < 25 ? "healthy" : bmi < 30 ? "overweight" : "obese"}
                        </div>
                      </div>
                    </div>

                    <button onClick={openProfile} className="w-full text-left rounded-xl px-3 py-2 flex items-center justify-between active:scale-[0.98] transition-transform"
                      style={{ background: "transparent", border: `1px dashed ${C.outlineVar}` }}>
                      <span className="font-label text-[11px]" style={{ color: C.variant }}>
                        Height {userProfile.height}cm · {userProfile.age ?? "—"}y · {userProfile.gender ? (userProfile.gender === "female" ? "F" : "M") : "—"}
                      </span>
                      <span className="font-label text-[11px]" style={{ color: C.hydration }}>Edit</span>
                    </button>

                    {todayWeight ? (
                      <p className="font-label text-xs" style={{ color: C.variant }}>
                        Change: {todayWeight > userProfile.currentWeight! ? "+" : ""}{(todayWeight - userProfile.currentWeight!).toFixed(1)} kg from baseline
                      </p>
                    ) : null}
                    <button disabled={!todayWeight}
                      className="w-full h-11 rounded-xl font-headline text-sm active:scale-95 transition-all disabled:opacity-40"
                      style={{ background: weightSaved ? C.nutrition : C.hydration, color: weightSaved ? "#102000" : "#001f24" }}
                      onClick={async () => {
                        if (!todayWeight || !currentUser) return;
                        const today = todayMidnight();
                        const bf = estimateBodyFat(todayWeight, userProfile.height!, userProfile.age, userProfile.gender || undefined);
                        await saveWeightLog(currentUser.uid, today, { date: today, weight: todayWeight, bodyFatPercentage: bf });
                        await updateLog({ weight: todayWeight, bodyFatPercentage: bf });
                        setWeightSaved(true);
                      }}>
                      <IconCheck size={15} className="inline mr-1.5" />{weightSaved ? "Saved!" : "Save Measurements"}
                    </button>
                  </div>
                </>
                );
              })()}
            </div>
          </TabsContent>

          {/* ── TRAIN (Exercise) ──────────────────────────────────────────── */}
          <TabsContent value="train" className="mt-0 px-5 pt-2 space-y-5 max-w-lg mx-auto">
            <div className="flex items-end justify-between">
              <h2 className="font-headline text-title-md flex items-center gap-2" style={{ color: C.onSurface }}>
                <IconDumbbell size={20} style={{ color: C.exercise }} /> Training
              </h2>
              <span className="font-label text-xs" style={{ color: C.variant }}>{exerciseCalories} / {exerciseGoal} cal</span>
            </div>
            <Gauge value={exerciseCalories} max={exerciseGoal} color={C.exercise} />

            {/* AI input */}
            <div className="glass-card rounded-xl p-4">
              <label className="font-label text-xs uppercase tracking-widest" style={{ color: C.variant }}>Log with AI</label>
              <div className="flex gap-2 mt-2">
                <input type="text" value={exerciseDescription} onChange={e => setExerciseDescription(e.target.value)}
                  placeholder="e.g. 3x10 bench press 80kg…" disabled={isAnalyzingExercise}
                  onKeyDown={e => e.key === "Enter" && analyzeExercise()}
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: C.inputBg, border: `1px solid ${C.outline}`, color: C.onSurface }} />
                <button onClick={analyzeExercise} disabled={isAnalyzingExercise || !exerciseDescription.trim()}
                  className="px-4 rounded-xl font-headline text-sm active:scale-95 transition-all disabled:opacity-40"
                    style={{ background: C.exercise, color: "#351000" }}>
                  {isAnalyzingExercise ? <IconSpinner size={16} className="animate-spin" /> : <><IconSparkle size={14} className="inline mr-1" />AI</>}
                  </button>
              </div>
              {exerciseAnalysisError && <p className="text-xs mt-1" style={{ color: "#ffb4ab" }}>{exerciseAnalysisError}</p>}
            </div>

            {/* Category toggle — pill style, both identical shape */}
            <div className="flex gap-2 p-1 rounded-2xl" style={{ background: C.inputBg, border: `1px solid ${C.outline}` }}>
              {(["cardio", "weight-training"] as const).map(cat => {
                const active = exerciseCategory === cat;
                return (
                  <button key={cat} onClick={() => setExerciseCategory(cat)}
                    className="flex-1 h-10 rounded-xl font-headline text-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    style={{
                      background: active ? C.exercise : "transparent",
                      color: active ? "#1a0800" : C.variant,
                    }}>
                    {cat === "cardio"
                      ? <><IconFlame size={15} />Cardio</>
                      : <><IconDumbbell size={15} />Weights</>}
                  </button>
                );
              })}
            </div>

            {exerciseCategory === "cardio" && (
              <div className="space-y-2">
                {cardioExercises.map(ex => (
                  <div key={ex.id} className="glass-card rounded-xl">
                    <CustomizableCardioItem name={ex.name} defaultDuration={ex.duration} defaultDistance={ex.distance}
                      isCompleted={completedExercises.has(ex.id)}
                      onAdd={async (dur, dist) => { const was = completedExercises.has(ex.id); toggleExercise(ex.id); if (!was) await saveQuickExercise(ex.name, "cardio", dur, undefined, undefined, undefined, undefined, dist); }} />
                  </div>
                ))}
              </div>
            )}

            {exerciseCategory === "weight-training" && (
              <div className="space-y-4">
                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
                  {weightTrainingCategories.map(cat => {
                    const sel = selectedMuscleGroup === cat.id;
                    const MI = MUSCLE_ICONS[cat.icon] ?? IconDumbbell;
                    return (
                      <button key={cat.id} onClick={() => setSelectedMuscleGroup(cat.id)}
                        className="flex items-center gap-1.5 shrink-0 px-3.5 h-10 rounded-xl text-sm font-headline active:scale-90 transition-all"
                        style={{
                          background: sel ? C.exercise : C.inputBg,
                          border: `1px solid ${sel ? C.exercise : C.outline}`,
                          color: sel ? "#1a0800" : C.variant,
                        }}>
                        <MI size={16} style={{ color: sel ? "#1a0800" : C.variant }} />
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
                {weightTrainingCategories.filter(c => c.id === selectedMuscleGroup).map(cat => (
                  <div key={cat.id} className="space-y-2">
                    {cat.exercises.map(ex => (
                      <div key={ex.id} className="glass-card rounded-xl">
                        <CustomizableExerciseItem name={ex.name} defaultReps={ex.reps} defaultSets={ex.sets} defaultWeight={0}
                          isCompleted={completedExercises.has(ex.id)}
                          onAdd={async (sets, reps, weight) => { const was = completedExercises.has(ex.id); toggleExercise(ex.id); if (!was) await saveQuickExercise(ex.name, "weight-training", undefined, sets, reps, cat.id, weight); }} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <button className="w-full h-11 rounded-xl font-headline text-sm glass-card active:scale-95 transition-all"
              style={{ color: C.variant, border: `1px solid ${C.outline}` }}
              onClick={() => { setExerciseCalories(0); setCompletedExercises(new Set()); updateLog({ exerciseCalories: 0 }); }}>
              Reset Daily Progress
            </button>

            {exercises.length > 0 && (
              <div className="glass-card rounded-xl p-4">
                <h3 className="font-headline text-sm mb-3" style={{ color: C.onSurface }}>Session Log</h3>
                <ExerciseHistory exercises={exercises} onDelete={handleDeleteExercise} />
              </div>
            )}
          </TabsContent>

          {/* ── PROGRESS (Streak + Summary + AI) ─────────────────────────── */}
          <TabsContent value="progress" className="mt-0 px-5 pt-2 space-y-5 max-w-lg mx-auto">

            {/* Streak hero */}
            <div className="glass-card rounded-xl p-5 relative overflow-hidden"
              style={{ borderLeft: `4px solid ${C.nutrition}` }}>
              <div className="absolute top-3 right-3 opacity-10" style={{ color: C.nutrition }}>
                <IconFlame size={56} />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: `${C.nutrition}20`, color: C.nutrition }}>
                  <IconFlame size={28} />
                </div>
                <div>
                  <h2 className="font-display text-2xl" style={{ color: C.onSurface }}>
                    {streakLogs.filter(l => l.isStreakDay).length} Day Streak
                  </h2>
                  <p className="font-body text-sm" style={{ color: C.variant }}>Keep it up! Consistency is key.</p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4">
              <StreakStats logs={streakLogs} />
            </div>

            <div className="glass-card rounded-xl p-4">
              <h3 className="font-headline text-sm mb-2" style={{ color: C.onSurface }}>Activity Heatmap</h3>
              <p className="font-label text-xs mb-3 uppercase tracking-widest" style={{ color: C.variant }}>
                Green = all goals · Yellow = partial · Gray = minimal
              </p>
              <StreakCalendar logs={streakLogs} monthsToShow={1} />
            </div>

            {/* divider */}
            <div style={{ height: 1, background: `${C.outline}50` }} />

            {/* Summary */}
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-sm flex items-center gap-2" style={{ color: C.onSurface }}>
                <IconBarChart size={15} style={{ color: C.hydration }} /> Summary
              </h3>
              <div className="flex gap-1">
                {(["day", "week", "month", "year"] as const).map(p => (
                  <button key={p} onClick={() => setSummaryPeriod(p)}
                    className="px-2.5 py-1 rounded-lg font-label text-xs transition-all active:scale-90"
                    style={{
                      background: summaryPeriod === p ? C.hydration : C.inputBg,
                      color: summaryPeriod === p ? "#001f24" : C.variant,
                    }}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {isSummaryLoading ? (
              <div className="flex justify-center py-8">
                <IconSpinner size={24} className="animate-spin" style={{ color: C.hydration }} />
              </div>
            ) : (
              <div className="glass-card rounded-xl p-4 space-y-4">
                {[
                  { label: "Hydration", Icon: IconDroplet,  pct: getSd().water.percentage, consumed: `${getSd().water.consumed.toFixed(1)}L`, goal: `${(getSd().water.goal * getSd().totalDays).toFixed(1)}L`, color: C.hydration },
                  { label: "Calories",  Icon: IconUtensils, pct: getSd().calories.percentage, consumed: `${Math.round(getSd().calories.consumed)} kcal`, goal: `${Math.round(getSd().calories.goal * getSd().totalDays)} kcal`, color: C.nutrition },
                  { label: "Exercise",  Icon: IconFlame,    pct: getSd().exercise.percentage, consumed: `${getSd().exercise.calories} cal`, goal: `${Math.round(getSd().exercise.goal * getSd().totalDays)} cal`, color: C.exercise },
                ].map(({ label, Icon, pct, consumed, goal, color }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm flex items-center gap-1.5" style={{ color: C.onSurface }}>
                        <Icon size={14} style={{ color }} />{label}
                      </span>
                      <span className="font-label text-xs" style={{ color: C.variant }}>{consumed} / {goal}</span>
                    </div>
                    <Gauge value={pct} max={100} color={color} />
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${C.outline}` }}>
                  <span className="font-body text-sm" style={{ color: C.variant }}>Overall</span>
                  <span className="font-display text-3xl" style={{ color: C.hydration }}>
                    {Math.round((getSd().water.percentage + getSd().calories.percentage + getSd().exercise.percentage) / 3)}%
                  </span>
                </div>
              </div>
            )}

            {/* Export */}
            <div className="glass-card rounded-xl p-4 space-y-3">
              <h3 className="font-headline text-sm" style={{ color: C.onSurface }}>Export Data</h3>
              <div className="flex gap-2">
                {(["csv", "json"] as const).map(fmt => (
                  <button key={fmt} onClick={() => exportData(fmt)}
                    className="flex-1 h-11 rounded-xl font-headline text-sm glass-card active:scale-95 transition-all flex items-center justify-center gap-2"
                    style={{ color: C.variant, border: `1px solid ${C.outline}` }}>
                    {fmt === "csv" ? <><IconFile size={15} /> CSV</> : <><IconBraces size={15} /> JSON</>}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Coach */}
            <div className="glass-card rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-sm flex items-center gap-2" style={{ color: C.onSurface }}>
                  <IconBrain size={16} style={{ color: C.hydration }} /> AI Coach
                </h3>
                <button onClick={fetchAIAnalysis} disabled={isAnalyzingAI}
                  className="px-4 h-9 rounded-xl font-headline text-xs active:scale-95 transition-all disabled:opacity-40 flex items-center gap-1.5"
                  style={{ background: `${C.hydration}20`, color: C.hydration, border: `1px solid ${C.hydration}50` }}>
                  {isAnalyzingAI ? <IconSpinner size={13} className="animate-spin" /> : <><IconSparkle size={13} /> Analyze</>}
                </button>
              </div>

              {isAnalyzingAI ? (
                <div className="flex flex-col items-center py-8 gap-3">
                  <IconSpinner size={24} className="animate-spin" style={{ color: C.hydration }} />
                  <p className="font-label text-xs" style={{ color: C.variant }}>Crunching your data…</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-4">
                  <div className="text-center py-5 rounded-xl" style={{ background: `${C.hydration}10`, border: `1px solid ${C.hydration}20` }}>
                    <div className="font-display text-6xl" style={{ color: C.hydration }}>{aiAnalysis.overallScore}</div>
                    <div className="font-label text-xs uppercase tracking-widest mt-1" style={{ color: C.variant }}>Fitness Score</div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Hydration", text: aiAnalysis.hydrationInsight, color: C.hydration },
                      { label: "Nutrition",  text: aiAnalysis.nutritionInsight, color: C.nutrition },
                      { label: "Exercise",  text: aiAnalysis.exerciseInsight,  color: C.exercise },
                    ].map(({ label, text, color }) => (
                      <div key={label} className="rounded-xl p-3" style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                        <div className="font-label text-xs uppercase tracking-widest mb-1.5" style={{ color }}>{label}</div>
                        <p className="font-body text-xs leading-relaxed line-clamp-4" style={{ color: C.variant }}>{text}</p>
                      </div>
                    ))}
                  </div>

                  {aiAnalysis.highlights?.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-label text-xs uppercase tracking-widest flex items-center gap-1.5" style={{ color: C.nutrition }}>
                        <IconCheck size={11} /> Highlights
                      </div>
                      {aiAnalysis.highlights.map((h, i) => (
                        <div key={i} className="font-body text-sm flex items-start gap-2" style={{ color: C.onSurface }}>
                          <span style={{ color: C.nutrition }}>·</span>{h}
                        </div>
                      ))}
                    </div>
                  )}

                  {aiAnalysis.areasToImprove?.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-label text-xs uppercase tracking-widest flex items-center gap-1.5" style={{ color: C.exercise }}>
                        <IconTrendingUp size={11} /> Improve
                      </div>
                      {aiAnalysis.areasToImprove.map((a, i) => (
                        <div key={i} className="font-body text-sm flex items-start gap-2" style={{ color: C.onSurface }}>
                          <span style={{ color: C.exercise }}>·</span>{a}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-center py-4 rounded-xl italic"
                    style={{ background: `${C.hydration}08`, border: `1px solid ${C.hydration}15` }}>
                    <p className="font-body text-sm" style={{ color: C.variant }}>"{aiAnalysis.motivationalMessage}"</p>
                  </div>

                  {aiAnalysis.weeklyTip && (
                    <div className="rounded-xl p-4" style={{ background: `${C.exercise}10`, border: `1px solid ${C.exercise}20` }}>
                      <div className="font-label text-xs uppercase tracking-widest mb-1.5" style={{ color: C.exercise }}>Tip</div>
                      <p className="font-body text-sm" style={{ color: C.onSurface }}>{aiAnalysis.weeklyTip}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 flex flex-col items-center gap-3">
                  <div className="opacity-20" style={{ color: C.hydration }}><IconBrain size={48} /></div>
                  <p className="font-body text-sm" style={{ color: C.variant }}>Tap Analyze for AI-powered insights</p>
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* ── Profile settings sheet ── */}
      {showProfile && (
        <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center sheet-backdrop${sheetClosing ? " sheet-backdrop--closing" : ""}`}
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={closeProfile}>
          <div className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl glass-overlay overflow-y-auto sheet-panel${sheetClosing ? " sheet-panel--closing" : ""}`}
            style={{ maxHeight: "88vh", border: `1px solid ${C.outlineVar}`, paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
            onClick={e => e.stopPropagation()}>
            {/* header */}
            <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between glass-overlay"
              style={{ borderBottom: `1px solid ${C.outlineVar}` }}>
              <div className="flex items-center gap-3">
                {currentUser.photoURL
                  ? <img src={currentUser.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" style={{ border: `1px solid ${C.outline}` }} />
                  : <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center font-headline"><IconUser size={18} /></div>}
                <div>
                  <div className="font-headline text-base" style={{ color: C.onSurface }}>{currentUser.displayName ?? "Athlete"}</div>
                  <div className="font-label text-[11px]" style={{ color: C.variant }}>{currentUser.email}</div>
                </div>
              </div>
              <button onClick={closeProfile} className="w-9 h-9 rounded-full flex items-center justify-center glass-card active:scale-90 transition-transform" aria-label="Close profile">
                <IconX size={16} style={{ color: C.variant }} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Kinetic hero card */}
              <section className="relative">
                <div className="absolute -inset-0.5 rounded-2xl opacity-20 blur"
                  style={{ background: `linear-gradient(90deg, ${C.hydration}, transparent)` }} />
                <div className="glass-card relative rounded-2xl p-5 flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    <div className="w-20 h-20 rounded-full p-1" style={{ border: `2px solid ${C.hydration}` }}>
                      {currentUser.photoURL
                        ? <img src={currentUser.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                        : <div className="w-full h-full rounded-full flex items-center justify-center font-headline text-2xl" style={{ background: C.inputBg, color: C.hydration }}>{currentUser.displayName?.[0] ?? "A"}</div>}
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full font-label text-[10px] glow-box-cyan"
                      style={{ background: C.hydration, color: "#001f24" }}>
                      {isProfileComplete(userProfile) ? "ATHLETE" : "NEW"}
                    </div>
                  </div>
                  <h1 className="font-display text-xl" style={{ color: C.onSurface }}>{currentUser.displayName ?? "Athlete"}</h1>
                  <p className="font-label text-[11px] tracking-widest mt-0.5" style={{ color: C.variant }}>
                    MEMBER SINCE {currentUser.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).getFullYear() : new Date().getFullYear()}
                  </p>
                </div>
              </section>

              {/* Stats grid */}
              <section className="grid grid-cols-2 gap-3">
                <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center">
                  <span className="font-label text-[11px] mb-1" style={{ color: C.variant }}>LOGGED DAYS</span>
                  <span className="font-display text-2xl" style={{ color: C.hydration }}>{streakLogs.length}</span>
                </div>
                <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center">
                  <span className="font-label text-[11px] mb-1" style={{ color: C.variant }}>GOAL DAYS</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-2xl" style={{ color: C.nutrition }}>{streakLogs.filter(l => l.isStreakDay).length}</span>
                    <span className="font-label text-[11px]" style={{ color: C.nutrition }}>DAYS</span>
                  </div>
                </div>
              </section>

              {/* Body basics */}
              <div className="space-y-3">
                <h4 className="font-label text-xs uppercase tracking-widest" style={{ color: C.hydration }}>Body</h4>
                {!isProfileComplete(userProfile) && (
                  <p className="font-body text-xs -mt-1" style={{ color: C.variant }}>Enter your real measurements — the app never assumes values for you.</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-label text-[11px] uppercase tracking-wider" style={{ color: C.variant }}>Height (cm)</label>
                    <input type="number" inputMode="decimal" value={pfHeight} onChange={e => setPfHeight(e.target.value)} placeholder="e.g. 175"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: C.inputBg, border: `1px solid ${C.outline}`, color: C.onSurface }} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label text-[11px] uppercase tracking-wider" style={{ color: C.variant }}>Age</label>
                    <input type="number" inputMode="numeric" value={pfAge} onChange={e => setPfAge(e.target.value)} placeholder="e.g. 28"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: C.inputBg, border: `1px solid ${C.outline}`, color: C.onSurface }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="font-label text-[11px] uppercase tracking-wider" style={{ color: C.variant }}>Gender</label>
                  <div className="flex gap-2 p-1 rounded-2xl" style={{ background: C.inputBg, border: `1px solid ${C.outline}` }}>
                    {(["male", "female"] as const).map(g => {
                      const active = pfGender === g;
                      return (
                        <button key={g} onClick={() => setPfGender(g)}
                          className="flex-1 h-10 rounded-xl font-headline text-sm capitalize active:scale-95 transition-all"
                          style={{ background: active ? C.hydration : "transparent", color: active ? "#001f24" : C.variant }}>
                          {g}
                        </button>
                      );
                    })}
                  </div>
                  <p className="font-label text-[10px]" style={{ color: C.variant }}>Used to estimate body-fat % from your weight.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-label text-[11px] uppercase tracking-wider" style={{ color: C.variant }}>Current Weight (kg)</label>
                    <input type="number" inputMode="decimal" value={pfCurrentWeight} onChange={e => setPfCurrentWeight(e.target.value)} placeholder="—"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: C.inputBg, border: `1px solid ${C.outline}`, color: C.onSurface }} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label text-[11px] uppercase tracking-wider" style={{ color: C.variant }}>Target Weight (kg)</label>
                    <input type="number" inputMode="decimal" value={pfTargetWeight} onChange={e => setPfTargetWeight(e.target.value)} placeholder="—"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: C.inputBg, border: `1px solid ${C.outline}`, color: C.onSurface }} />
                  </div>
                </div>
              </div>

              {/* Daily goals */}
              <div className="space-y-3">
                <h4 className="font-label text-xs uppercase tracking-widest" style={{ color: C.nutrition }}>Daily Goals</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Water (L)",    v: pfWaterGoal,    set: setPfWaterGoal,    ph: "4" },
                    { label: "Calories",     v: pfCalorieGoal,  set: setPfCalorieGoal,  ph: "2000" },
                    { label: "Protein (g)",  v: pfProteinGoal,  set: setPfProteinGoal,  ph: "150" },
                    { label: "Exercise cal", v: pfExerciseGoal, set: setPfExerciseGoal, ph: "500" },
                  ].map(({ label, v, set, ph }) => (
                    <div key={label} className="space-y-1.5">
                      <label className="font-label text-[11px] uppercase tracking-wider" style={{ color: C.variant }}>{label}</label>
                      <input type="number" inputMode="decimal" value={v} onChange={e => set(e.target.value)} placeholder={ph}
                        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: C.inputBg, border: `1px solid ${C.outline}`, color: C.onSurface }} />
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={saveProfileSettings} disabled={profileSaving}
                className="w-full h-12 rounded-xl font-headline text-sm active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: C.hydration, color: "#001f24" }}>
                {profileSaving ? <IconSpinner size={16} className="animate-spin" /> : <><IconSave size={16} />Save Profile</>}
              </button>

              <button onClick={handleSignOut}
                className="w-full h-11 rounded-xl font-headline text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                style={{ background: "transparent", border: `1px solid ${C.outline}`, color: C.streak }}>
                <IconLogOut size={16} />Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── iOS install banner ── */}
      <InstallPWABanner />

      {/* ── Floating bottom navigation (full width, compact height) ── */}
      <nav className="fixed bottom-4 left-4 right-4 z-40 rounded-2xl pb-safe glass-overlay"
        style={{ boxShadow: isDark ? "0 8px 40px rgba(0,0,0,0.6)" : "0 4px 24px rgba(0,0,0,0.10)", border: `1px solid ${C.outlineVar}` }}>
        <div className="flex items-center justify-around px-3 py-1.5">
          {NAV.map(({ id, Icon, label }) => {
            const isActive = activeTab === id;
            const accentColor = id === "train" ? C.exercise : id === "progress" ? C.nutrition : C.hydration;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                aria-label={`${label} tab`}
                aria-pressed={isActive}
                className="flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all active:scale-90"
                style={{ minWidth: 64, minHeight: 44, paddingTop: 4, paddingBottom: 4 }}>
                <Icon size={20} style={{ color: isActive ? accentColor : C.variant }} className="transition-colors duration-150" />
                <span className="font-label text-[10px] uppercase tracking-wider leading-none transition-colors duration-150"
                  style={{ color: isActive ? accentColor : C.variant }}>
                  {label}
                </span>
                {/* 2px accent underline — same height always, just changes opacity */}
                <div className="h-[2px] w-5 rounded-full transition-all duration-200"
                  style={{ background: accentColor, opacity: isActive ? 1 : 0 }} />
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
