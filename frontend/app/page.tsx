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
import { IFitnessLog, IMeal, IExercise, IUserProfile } from "@/lib/types";
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
import { Loader2 } from "lucide-react";

/* ─── Design tokens ──────────────────────────────────────────────────────────
   Kinetic Performance palette (from Stitch project 4530245392740715731)
*/
const C = {
  hydration: "#00daf3",
  nutrition:  "#9ffb00",
  exercise:  "#ff6b00",
  surface:   "#1c1c1e",
  bg:        "#080808",
  onSurface: "#e5e2e1",
  variant:   "#bac9cc",
  outline:   "#3b494c",
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
  water, waterGoal, calories, calorieGoal, exercise, exerciseGoal
}: {
  water: number; waterGoal: number;
  calories: number; calorieGoal: number;
  exercise: number; exerciseGoal: number;
}) {
  const rings = [
    { r: 78, color: C.hydration, value: water,     max: waterGoal,    label: "Water" },
    { r: 60, color: C.nutrition,  value: calories,  max: calorieGoal,  label: "Kcal" },
    { r: 44, color: C.exercise,  value: exercise,  max: exerciseGoal, label: "Burn" },
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
                  style={{ transition: "stroke-dashoffset 0.8s ease", filter: `drop-shadow(0 0 6px ${color}55)` }} />
              </g>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className="font-display text-4xl text-[#e5e2e1] leading-none">{overall}<span className="text-xl font-headline">%</span></span>
          <span className="font-label text-[10px] text-[#bac9cc] uppercase tracking-widest mt-1">Total Goal</span>
        </div>
      </div>
      {/* Legend */}
      <div className="flex gap-6">
        {rings.map(({ color, label, value, max }) => (
          <div key={label} className="text-center">
            <span className="font-label text-[10px] block uppercase tracking-wider" style={{ color }}>{label}</span>
            <span className="font-headline text-sm text-[#e5e2e1]">
              {label === "Water" ? `${value.toFixed(1)}L` : `${Math.round(value)}`}
            </span>
            <span className="font-label text-[9px] text-[#bac9cc] block">
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

/* ─── Bottom nav ─────────────────────────────────────────────────────────────*/

const NAV = [
  { id: "hydration", emoji: "💧", label: "Water" },
  { id: "diet",      emoji: "🥗", label: "Diet"  },
  { id: "exercise",  emoji: "🏋️", label: "Train" },
  { id: "weight",    emoji: "⚖️", label: "Weight"},
  { id: "streak",    emoji: "🔥", label: "Streak"},
  { id: "summary",   emoji: "📊", label: "Stats" },
] as const;

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
  useEffect(() => { setIsMounted(true); }, []);
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
  const [todayBodyFat,    setTodayBodyFat]    = useState<number|null>(null);
  const [weightSaved,     setWeightSaved]     = useState(false);

  /* app state */
  const [meals,       setMeals]       = useState<IMeal[]>([]);
  const [exercises,   setExercises]   = useState<IExercise[]>([]);
  const [streakLogs,  setStreakLogs]  = useState<IFitnessLog[]>([]);
  const [userProfile, setUserProfile] = useState<IUserProfile|null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [activeTab,   setActiveTab]   = useState("hydration");

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

  /* tab persistence */
  useEffect(() => { const s = localStorage.getItem("fitActiveTab"); if (s) setActiveTab(s); }, []);
  useEffect(() => { if (isMounted) localStorage.setItem("fitActiveTab", activeTab); }, [activeTab, isMounted]);

  /* ─── Data fetching ─────────────────────────────────────────────────────────*/

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
    setUserProfile(null); setSummaryData(null); setAiAnalysis(null); setTodayWeight(null); setTodayBodyFat(null);
  };

  /* ─── Splash / sign-in ───────────────────────────────────────────────────────*/

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <div className="flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl glass-card">🏋️</div>
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: C.hydration }} />
      </div>
    </div>
  );

  if (!currentUser) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 px-5"
      style={{ background: `radial-gradient(ellipse at 50% 0%, ${C.hydration}15 0%, ${C.bg} 70%)` }}>

      <div className="text-center space-y-4">
        <div className="w-24 h-24 rounded-[28px] glass-card flex items-center justify-center text-5xl mx-auto"
          style={{ boxShadow: `0 0 40px ${C.hydration}30` }}>🏋️</div>
        <h1 className="font-display text-4xl" style={{ color: C.onSurface }}>FitTrack</h1>
        <p className="font-body text-sm max-w-xs mx-auto" style={{ color: C.variant }}>
          Kinetic Performance — track hydration, nutrition &amp; training in one place
        </p>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-2 max-w-xs">
        {[
          { emoji: "💧", label: "Hydration", color: C.hydration },
          { emoji: "🥗", label: "AI Nutrition", color: C.nutrition },
          { emoji: "🏋️", label: "Workouts", color: C.exercise },
          { emoji: "🔥", label: "Streaks", color: C.exercise },
        ].map(({ emoji, label, color }) => (
          <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-headline glass-card"
            style={{ color, border: `1px solid ${color}30` }}>
            {emoji} {label}
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

      <p className="font-label text-xs" style={{ color: C.variant }}>Your data is private and encrypted</p>
    </div>
  );

  /* ─── Main app ───────────────────────────────────────────────────────────────*/

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg, color: C.onSurface }}>

      {/* ── Top app bar ── */}
      <header className="sticky top-0 z-30 px-5 py-3 flex items-center justify-between"
        style={{ background: `${C.bg}cc`, backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.outline}40` }}>
        <div className="flex items-center gap-3">
          <button onClick={handleSignOut} className="active:scale-90 transition-transform">
            {currentUser.photoURL
              ? <img src={currentUser.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" style={{ border: `1px solid ${C.outline}` }} />
              : <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center font-headline">
                  {currentUser.displayName?.[0] ?? "U"}
                </div>
            }
          </button>
          <div>
            <div className="font-label text-[10px] uppercase tracking-widest" style={{ color: C.variant }}>{greeting}</div>
            <div className="font-headline text-base truncate max-w-[140px]">{currentUser.displayName?.split(" ")[0] ?? "Athlete"}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-label text-[10px] uppercase tracking-widest" style={{ color: C.variant }}>Today</div>
          <div className="font-display text-lg" style={{ color: C.hydration }}>
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        </div>
      </header>

      {/* ── Daily activity hero ── */}
      <div className="px-5 pt-6 pb-2 flex flex-col items-center gap-1">
        {isLoading ? (
          <div className="h-52 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: C.hydration }} />
          </div>
        ) : (
          <ConcentricRings
            water={waterIntake} waterGoal={dailyWaterGoal}
            calories={calories} calorieGoal={calorieGoal}
            exercise={exerciseCalories} exerciseGoal={exerciseGoal} />
        )}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto pb-28">
        <Tabs value={activeTab} onValueChange={setActiveTab}>

          {/* ── HYDRATION ─────────────────────────────────────────────────── */}
          <TabsContent value="hydration" className="mt-0 px-5 pt-2 space-y-5 max-w-lg mx-auto">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-headline text-title-md" style={{ color: C.onSurface }}>Hydration</h2>
                <p className="font-label text-[11px]" style={{ color: C.variant }}>{waterIntake.toFixed(2)}L / {dailyWaterGoal}L Target</p>
              </div>
              <button onClick={() => { setWaterIntake(0); updateLog({ waterLiters: 0 }, 0); }}
                className="font-label text-xs px-3 py-1.5 rounded-lg glass-card active:scale-90 transition-transform"
                style={{ color: C.variant, border: `1px solid ${C.outline}` }}>Reset</button>
            </div>

            {/* Animated gauge */}
            <div className="h-4 rounded-full overflow-hidden" style={{ background: `${C.hydration}1a` }}>
              <div className="h-full rounded-full transition-all duration-700 relative"
                style={{ width: `${Math.min((waterIntake/dailyWaterGoal)*100,100)}%`, background: C.hydration, boxShadow: `0 0 12px ${C.hydration}80` }}>
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
              </div>
            </div>

            {/* Quick add buttons */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Glass", amount: 0.25, icon: "🥛" },
                { label: "Bottle", amount: 0.5, icon: "🍶" },
                { label: "Jug", amount: 1, icon: "🫙" },
              ].map(({ label, amount, icon }) => (
                <button key={label}
                  onClick={() => { const n = Math.min(waterIntake + amount, dailyWaterGoal * 2); setWaterIntake(n); updateLog({ waterLiters: n }, n); }}
                  className="glass-card rounded-xl p-3 text-center active:scale-95 transition-all"
                  style={{ border: `1px solid ${C.hydration}30` }}>
                  <span className="block text-2xl mb-1">{icon}</span>
                  <span className="font-label text-[10px] block" style={{ color: C.variant }}>{label}</span>
                  <span className="font-headline text-sm" style={{ color: C.onSurface }}>{amount * 1000}ml</span>
                </button>
              ))}
            </div>

            {/* Also allow removing */}
            <button onClick={() => { const n = Math.max(waterIntake - 0.25, 0); setWaterIntake(n); updateLog({ waterLiters: n }, n); }}
              className="w-full h-12 rounded-xl font-headline text-sm glass-card active:scale-95 transition-all"
              style={{ color: C.variant, border: `1px solid ${C.outline}` }}>
              − Remove 250ml
            </button>

            {/* Water cup grid */}
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: Math.ceil(dailyWaterGoal / 0.25) }).map((_, i) => {
                const t = (i + 1) * 0.25;
                return (
                  <div key={i} className="h-14 rounded-xl flex items-center justify-center transition-all"
                    style={{
                      background: waterIntake >= t ? `${C.hydration}20` : `${C.surface}60`,
                      border: `1px solid ${waterIntake >= t ? C.hydration + "50" : C.outline}`,
                    }}>
                    {waterIntake >= t && <span className="text-lg">💧</span>}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ── DIET ──────────────────────────────────────────────────────── */}
          <TabsContent value="diet" className="mt-0 px-5 pt-2 space-y-5 max-w-lg mx-auto">
            <h2 className="font-headline text-title-md" style={{ color: C.onSurface }}>🥗 Nutrition Macros</h2>

            {/* Macro bars */}
            <div className="glass-card rounded-xl p-5 space-y-5">
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

            {/* Add food */}
            <div className="glass-card rounded-xl p-4 space-y-3">
              <div>
                <label className="font-label text-[10px] uppercase tracking-widest" style={{ color: C.variant }}>Meal Type</label>
                <div className="mt-2">
                  <MealTypeSelect value={mealType} onChange={setMealType} />
                </div>
              </div>
              <div>
                <label className="font-label text-[10px] uppercase tracking-widest" style={{ color: C.variant }}>Describe your meal</label>
                <div className="flex gap-2 mt-2">
                  <input type="text" value={foodDescription} onChange={e => setFoodDescription(e.target.value)}
                    placeholder="e.g. 2 eggs, toast, coffee…" disabled={isAnalyzing}
                    onKeyDown={e => e.key === "Enter" && analyzeFood()}
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: "#2a2a2a", border: `1px solid ${C.outline}`, color: C.onSurface }} />
                  <button onClick={analyzeFood} disabled={isAnalyzing || !foodDescription.trim()}
                    className="px-4 rounded-xl font-headline text-sm active:scale-95 transition-all disabled:opacity-40"
                    style={{ background: C.nutrition, color: "#102000" }}>
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : "✨ AI"}
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
          </TabsContent>

          {/* ── EXERCISE ──────────────────────────────────────────────────── */}
          <TabsContent value="exercise" className="mt-0 px-5 pt-2 space-y-5 max-w-lg mx-auto">
            <div className="flex items-end justify-between">
              <h2 className="font-headline text-title-md" style={{ color: C.onSurface }}>🏋️ Training</h2>
              <span className="font-label text-xs" style={{ color: C.variant }}>{exerciseCalories} / {exerciseGoal} cal</span>
            </div>
            <Gauge value={exerciseCalories} max={exerciseGoal} color={C.exercise} />

            {/* AI input */}
            <div className="glass-card rounded-xl p-4">
              <label className="font-label text-[10px] uppercase tracking-widest" style={{ color: C.variant }}>Log with AI</label>
              <div className="flex gap-2 mt-2">
                <input type="text" value={exerciseDescription} onChange={e => setExerciseDescription(e.target.value)}
                  placeholder="e.g. 3x10 bench press 80kg…" disabled={isAnalyzingExercise}
                  onKeyDown={e => e.key === "Enter" && analyzeExercise()}
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: "#2a2a2a", border: `1px solid ${C.outline}`, color: C.onSurface }} />
                <button onClick={analyzeExercise} disabled={isAnalyzingExercise || !exerciseDescription.trim()}
                  className="px-4 rounded-xl font-headline text-sm active:scale-95 transition-all disabled:opacity-40"
                  style={{ background: C.exercise, color: "#351000" }}>
                  {isAnalyzingExercise ? <Loader2 className="h-4 w-4 animate-spin" /> : "✨ AI"}
                </button>
              </div>
              {exerciseAnalysisError && <p className="text-xs mt-1" style={{ color: "#ffb4ab" }}>{exerciseAnalysisError}</p>}
            </div>

            {/* Category toggle */}
            <div className="flex gap-2">
              {(["cardio", "weight-training"] as const).map(cat => (
                <button key={cat} onClick={() => setExerciseCategory(cat)}
                  className="flex-1 h-11 rounded-xl font-headline text-sm active:scale-95 transition-all"
                  style={{
                    background: exerciseCategory === cat ? C.exercise : "#2a2a2a",
                    color: exerciseCategory === cat ? "#351000" : C.variant,
                    border: `1px solid ${exerciseCategory === cat ? C.exercise : C.outline}`,
                  }}>
                  {cat === "cardio" ? "🏃 Cardio" : "🏋️ Weights"}
                </button>
              ))}
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
                <div className="grid grid-cols-4 gap-2">
                  {weightTrainingCategories.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedMuscleGroup(cat.id)}
                      className="flex flex-col items-center py-2.5 rounded-xl text-xs font-headline active:scale-90 transition-all"
                      style={{
                        background: selectedMuscleGroup === cat.id ? `${C.exercise}20` : "#2a2a2a",
                        border: `1px solid ${selectedMuscleGroup === cat.id ? C.exercise : C.outline}`,
                        color: selectedMuscleGroup === cat.id ? C.exercise : C.variant,
                      }}>
                      <span className="text-lg mb-0.5">{cat.icon}</span>{cat.name}
                    </button>
                  ))}
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

          {/* ── WEIGHT ────────────────────────────────────────────────────── */}
          <TabsContent value="weight" className="mt-0 px-5 pt-2 space-y-5 max-w-lg mx-auto">
            <h2 className="font-headline text-title-md" style={{ color: C.onSurface }}>⚖️ Body Metrics</h2>
            {userProfile ? (
              <>
                <WeightGraph uid={currentUser.uid} days={30} targetWeight={userProfile.targetWeight} />
                <div className="glass-card rounded-xl p-5 space-y-4">
                  <h3 className="font-headline text-sm" style={{ color: C.onSurface }}>Today's Measurements</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Weight (kg)", value: todayWeight, onChange: (v: number) => { setTodayWeight(v); setWeightSaved(false); }, placeholder: userProfile.currentWeight.toString() },
                      { label: "Body Fat (%)", value: todayBodyFat, onChange: (v: number) => { setTodayBodyFat(v); setWeightSaved(false); }, placeholder: userProfile.bodyFatPercentage.toString() },
                    ].map(({ label, value, onChange, placeholder }) => (
                      <div key={label} className="space-y-1.5">
                        <label className="font-label text-[10px] uppercase tracking-widest" style={{ color: C.variant }}>{label}</label>
                        <input type="number" step="0.1" value={value || ""}
                          onChange={e => onChange(parseFloat(e.target.value) || 0)}
                          placeholder={placeholder}
                          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                          style={{ background: "#2a2a2a", border: `1px solid ${C.outline}`, color: C.onSurface }} />
                      </div>
                    ))}
                  </div>
                  {todayWeight && (
                    <p className="font-label text-xs" style={{ color: C.variant }}>
                      Change: {todayWeight > userProfile.currentWeight ? "+" : ""}{(todayWeight - userProfile.currentWeight).toFixed(1)} kg
                    </p>
                  )}
                  <button disabled={!todayWeight}
                    className="w-full h-12 rounded-xl font-headline text-sm active:scale-95 transition-all disabled:opacity-40"
                    style={{ background: weightSaved ? C.nutrition : C.hydration, color: weightSaved ? "#102000" : "#001f24" }}
                    onClick={async () => {
                      if (!todayWeight || !currentUser) return;
                      const today = todayMidnight();
                      await saveWeightLog(currentUser.uid, today, { date: today, weight: todayWeight, bodyFatPercentage: todayBodyFat || undefined });
                      await updateLog({ weight: todayWeight, bodyFatPercentage: todayBodyFat || undefined });
                      setWeightSaved(true);
                    }}>
                    {weightSaved ? "✓ Saved!" : "Save Measurements"}
                  </button>
                </div>
              </>
            ) : (
              <div className="glass-card rounded-xl p-8 text-center" style={{ color: C.variant }}>Loading profile…</div>
            )}
          </TabsContent>

          {/* ── STREAK ────────────────────────────────────────────────────── */}
          <TabsContent value="streak" className="mt-0 px-5 pt-2 space-y-5 max-w-lg mx-auto">
            {/* Streak hero card */}
            <div className="glass-card rounded-xl p-5 relative overflow-hidden"
              style={{ borderLeft: `4px solid ${C.nutrition}` }}>
              <div className="absolute top-3 right-3 text-6xl opacity-10">🔥</div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
                  style={{ background: `${C.nutrition}20` }}>🔥</div>
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
              <h3 className="font-headline text-sm mb-3" style={{ color: C.onSurface }}>Activity Heatmap</h3>
              <p className="font-label text-[10px] mb-3 uppercase tracking-widest" style={{ color: C.variant }}>
                Green = all goals · Yellow = partial · Gray = minimal
              </p>
              <StreakCalendar logs={streakLogs} monthsToShow={1} />
            </div>
          </TabsContent>

          {/* ── SUMMARY ───────────────────────────────────────────────────── */}
          <TabsContent value="summary" className="mt-0 px-5 pt-2 space-y-5 max-w-lg mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-title-md" style={{ color: C.onSurface }}>📊 Summary</h2>
              <div className="flex gap-1">
                {(["day", "week", "month", "year"] as const).map(p => (
                  <button key={p} onClick={() => setSummaryPeriod(p)}
                    className="px-2.5 py-1 rounded-lg font-label text-xs transition-all active:scale-90"
                    style={{
                      background: summaryPeriod === p ? C.hydration : "#2a2a2a",
                      color: summaryPeriod === p ? "#001f24" : C.variant,
                    }}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {isSummaryLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: C.hydration }} />
              </div>
            ) : (
              <div className="glass-card rounded-xl p-5 space-y-5">
                {[
                  { label: "Hydration", emoji: "💧", pct: getSd().water.percentage, consumed: `${getSd().water.consumed.toFixed(1)}L`, goal: `${(getSd().water.goal * getSd().totalDays).toFixed(1)}L`, color: C.hydration },
                  { label: "Calories",  emoji: "🥗", pct: getSd().calories.percentage, consumed: `${Math.round(getSd().calories.consumed)} kcal`, goal: `${Math.round(getSd().calories.goal * getSd().totalDays)} kcal`, color: C.nutrition },
                  { label: "Exercise",  emoji: "🔥", pct: getSd().exercise.percentage, consumed: `${getSd().exercise.calories} cal`, goal: `${Math.round(getSd().exercise.goal * getSd().totalDays)} cal`, color: C.exercise },
                ].map(({ label, emoji, pct, consumed, goal, color }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm" style={{ color: C.onSurface }}>{emoji} {label}</span>
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
                    className="flex-1 h-11 rounded-xl font-headline text-sm glass-card active:scale-95 transition-all"
                    style={{ color: C.variant, border: `1px solid ${C.outline}` }}>
                    {fmt === "csv" ? "📄 CSV" : "📦 JSON"}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Coach */}
            <div className="glass-card rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-sm" style={{ color: C.onSurface }}>🧠 AI Coach</h3>
                <button onClick={fetchAIAnalysis} disabled={isAnalyzingAI}
                  className="px-4 h-9 rounded-xl font-headline text-xs active:scale-95 transition-all disabled:opacity-40"
                  style={{ background: `${C.hydration}20`, color: C.hydration, border: `1px solid ${C.hydration}50` }}>
                  {isAnalyzingAI ? <Loader2 className="h-3.5 w-3.5 animate-spin inline" /> : "✨ Analyze"}
                </button>
              </div>

              {isAnalyzingAI ? (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: C.hydration }} />
                  <p className="font-label text-xs" style={{ color: C.variant }}>Crunching your data…</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-4">
                  <div className="text-center py-5 rounded-xl" style={{ background: `${C.hydration}10`, border: `1px solid ${C.hydration}20` }}>
                    <div className="font-display text-6xl" style={{ color: C.hydration }}>{aiAnalysis.overallScore}</div>
                    <div className="font-label text-[10px] uppercase tracking-widest mt-1" style={{ color: C.variant }}>Fitness Score</div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Hydration", text: aiAnalysis.hydrationInsight, color: C.hydration },
                      { label: "Nutrition",  text: aiAnalysis.nutritionInsight, color: C.nutrition },
                      { label: "Exercise",  text: aiAnalysis.exerciseInsight,  color: C.exercise },
                    ].map(({ label, text, color }) => (
                      <div key={label} className="rounded-xl p-3" style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                        <div className="font-label text-[10px] uppercase tracking-widest mb-1.5" style={{ color }}>{label}</div>
                        <p className="font-body text-[10px] leading-relaxed line-clamp-4" style={{ color: C.variant }}>{text}</p>
                      </div>
                    ))}
                  </div>

                  {aiAnalysis.highlights?.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-label text-xs uppercase tracking-widest" style={{ color: C.nutrition }}>✓ Highlights</div>
                      {aiAnalysis.highlights.map((h, i) => (
                        <div key={i} className="font-body text-sm flex items-start gap-2" style={{ color: C.onSurface }}>
                          <span style={{ color: C.nutrition }}>·</span>{h}
                        </div>
                      ))}
                    </div>
                  )}

                  {aiAnalysis.areasToImprove?.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-label text-xs uppercase tracking-widest" style={{ color: C.exercise }}>↑ Improve</div>
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
                      <div className="font-label text-[10px] uppercase tracking-widest mb-1.5" style={{ color: C.exercise }}>Tip</div>
                      <p className="font-body text-sm" style={{ color: C.onSurface }}>{aiAnalysis.weeklyTip}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="text-5xl mb-3 opacity-30">🧠</div>
                  <p className="font-body text-sm" style={{ color: C.variant }}>Tap Analyze for AI-powered insights</p>
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* ── Floating bottom navigation ── */}
      <nav className="fixed bottom-4 left-4 right-4 z-40 rounded-2xl pb-safe"
        style={{ background: "#1c1c1edd", backdropFilter: "blur(20px)", border: `1px solid ${C.outline}`, boxShadow: "0 8px 32px #00000080" }}>
        <div className="flex items-stretch justify-around px-2 pt-2 pb-1">
          {NAV.map(({ id, emoji, label }) => {
            const isActive = activeTab === id;
            const accentColor = id === "hydration" ? C.hydration : id === "diet" ? C.nutrition : id === "exercise" ? C.exercise : id === "weight" ? C.hydration : id === "streak" ? C.nutrition : C.hydration;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all active:scale-90 relative min-w-[48px]">
                {/* Top indicator bar */}
                {isActive && (
                  <div className="absolute top-0 left-2 right-2 h-0.5 rounded-full" style={{ background: accentColor }} />
                )}
                <span className={`text-xl transition-all ${isActive ? "scale-110" : "opacity-50"}`}>{emoji}</span>
                <span className="font-label text-[9px] uppercase tracking-wide transition-all"
                  style={{ color: isActive ? accentColor : C.variant }}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
