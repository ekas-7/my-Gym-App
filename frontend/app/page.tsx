"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Droplet, Utensils, Dumbbell, TrendingUp, Target, Calendar as CalendarIcon, Heart, Scale, Sparkles } from "lucide-react";
import { ExerciseItem } from "@/components/exercise-item";
import { CardioItem } from "@/components/cardio-item";
import { BodyStats } from "@/components/body-stats";
import StreakStats from "@/components/streak-stats";
import StreakCalendar from "@/components/streak-calendar";
import SidebarCalendar from "@/components/sidebar-calendar";
import { MealHistory, MealTypeSelect } from "@/components/meal-history";
import { ExerciseHistory } from "@/components/exercise-history";
import { WeightGraph } from "@/components/weight-graph";
import { cardioExercises, weightTrainingCategories } from "@/lib/exercises";
import { calculateGoalsCompleted } from "@/lib/streak-utils";
import { IFitnessLog } from "@/models/FitnessLog";
import { IMeal } from "@/models/Meal";
import { IExercise } from "@/models/Exercise";

interface SummaryData {
  period: string;
  water: { consumed: number; goal: number; percentage: number };
  calories: { consumed: number; goal: number; percentage: number };
  exercise: { minutes: number; goal: number; percentage: number };
  totalDays: number;
}

interface UserProfile {
  currentWeight: number;
  targetWeight: number;
  bodyFatPercentage: number;
  skeletalMuscle: number;
  visceralFatIndex: number;
  bmr: number;
  activityLevel: string;
  goalType: string;
  weeklyWeightChangeGoal: number;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  waterGoal: number;
  exerciseGoal: number;
}

export default function Home() {
  // Date state - fix hydration issue
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setDate(new Date());
    setIsMounted(true);
  }, []);

  // Hydration state (in liters)
  const [waterIntake, setWaterIntake] = useState(0);
  const [dailyWaterGoal, setDailyWaterGoal] = useState(4); // Will be updated from profile

  // Diet state
  const [calories, setCalories] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(2000); // Will be updated from profile
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

  // Exercise state
  const [exerciseMinutes, setExerciseMinutes] = useState(0);
  const [exerciseGoal, setExerciseGoal] = useState(60); // Will be updated from profile
  const [exerciseDescription, setExerciseDescription] = useState('');
  const [isAnalyzingExercise, setIsAnalyzingExercise] = useState(false);
  const [exerciseAnalysisError, setExerciseAnalysisError] = useState('');
  const [exercises, setExercises] = useState<IExercise[]>([]);

  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Daily weight tracking
  const [todayWeight, setTodayWeight] = useState<number | null>(null);
  const [todayBodyFat, setTodayBodyFat] = useState<number | null>(null);

  // Summary period state
  const [summaryPeriod, setSummaryPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  
  // Summary data from MongoDB
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Exercise tracking state
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [exerciseCategory, setExerciseCategory] = useState<'cardio' | 'weight-training'>('cardio');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<'chest' | 'back' | 'shoulders'>('chest');

  // Streak tracking state
  const [streakLogs, setStreakLogs] = useState<IFitnessLog[]>([]);

  // Fetch today's fitness data on mount
  useEffect(() => {
    fetchTodayData();
    fetchUserProfile();
    fetchStreakData();
    fetchMeals();
    fetchExercises();
  }, []);

  // Fetch summary data when period changes
  useEffect(() => {
    fetchSummaryData();
  }, [summaryPeriod]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const result = await response.json();
      
      if (result.success) {
        setUserProfile(result.data);
        setDailyWaterGoal(result.data.waterGoal);
        setCalorieGoal(result.data.dailyCalorieTarget);
        setExerciseGoal(result.data.exerciseGoal);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchTodayData = async () => {
    try {
      const response = await fetch('/api/fitness');
      const result = await response.json();
      
      if (result.success) {
        setWaterIntake(result.data.waterLiters);
        setCalories(result.data.calories);
        setCarbs(result.data.carbs || 0);
        setFats(result.data.fats || 0);
        setProtein(result.data.protein || 0);
        setExerciseMinutes(result.data.exerciseMinutes);
        setTodayWeight(result.data.weight || null);
        setTodayBodyFat(result.data.bodyFatPercentage || null);
      }
    } catch (error) {
      console.error('Error fetching today\'s data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummaryData = async () => {
    try {
      const response = await fetch(`/api/fitness/summary?period=${summaryPeriod}`);
      const result = await response.json();
      
      if (result.success) {
        setSummaryData(result.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchStreakData = async () => {
    try {
      const response = await fetch('/api/fitness/streak?days=90');
      const result = await response.json();
      
      if (result.success) {
        setStreakLogs(result.data.logs);
      }
    } catch (error) {
      console.error('Error fetching streak data:', error);
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

  // Fetch today's exercises
  const fetchExercises = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/exercises?date=${today}`);
      const result = await response.json();
      if (result.success) {
        setExercises(result.data);
        // Calculate total minutes from exercises
        const totalMinutes = result.data.reduce((sum: number, ex: IExercise) => {
          if (ex.duration) {
            return sum + ex.duration;
          } else if (ex.sets && ex.sets.length > 0) {
            // Assume 2 minutes per set for weight training
            return sum + (ex.sets.length * 2);
          }
          return sum;
        }, 0);
        setExerciseMinutes(totalMinutes);
        // Also update the fitness log
        updateFitnessData({ exerciseMinutes: totalMinutes });
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  // Delete meal
  const handleDeleteMeal = async (id: string) => {
    try {
      const response = await fetch(`/api/meals?id=${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        fetchMeals(); // Refresh meals to recalculate totals
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  // Delete exercise
  const handleDeleteExercise = async (id: string) => {
    try {
      const response = await fetch(`/api/exercises?id=${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        fetchExercises(); // Refresh exercises to recalculate totals
      }
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  const updateFitnessData = async (data: { 
    waterLiters?: number; 
    calories?: number; 
    carbs?: number;
    fats?: number;
    protein?: number;
    exerciseMinutes?: number; 
    weight?: number; 
    bodyFatPercentage?: number;
  }) => {
    try {
      // First update the data
      await fetch('/api/fitness', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      // Calculate and update streak status
      const currentData: IFitnessLog = {
        waterLiters: data.waterLiters ?? waterIntake,
        waterGoal: dailyWaterGoal,
        calories: data.calories ?? calories,
        calorieGoal: calorieGoal,
        carbs: data.carbs ?? carbs,
        carbsGoal: carbsGoal,
        fats: data.fats ?? fats,
        fatsGoal: fatsGoal,
        protein: data.protein ?? protein,
        proteinGoal: proteinGoal,
        exerciseMinutes: data.exerciseMinutes ?? exerciseMinutes,
        exerciseGoal: exerciseGoal,
        weight: data.weight ?? (todayWeight || undefined),
        bodyFatPercentage: data.bodyFatPercentage ?? (todayBodyFat || undefined),
        exercises: [],
        date: new Date(),
        goalsCompleted: 0,
        totalGoals: 4,
        isStreakDay: false,
      };
      
      const streakData = calculateGoalsCompleted(currentData);
      
      // Update with streak data
      await fetch('/api/fitness', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          goalsCompleted: streakData.goalsCompleted,
          totalGoals: streakData.totalGoals,
          isStreakDay: streakData.isStreakDay,
        }),
      });
      
      // Refresh all data
      fetchSummaryData();
      fetchStreakData();
      
      // Update profile if weight or body fat changed
      if (userProfile && (data.weight !== undefined || data.bodyFatPercentage !== undefined)) {
        const profileUpdate: any = {};
        if (data.weight !== undefined) {
          profileUpdate.currentWeight = data.weight;
        }
        if (data.bodyFatPercentage !== undefined) {
          profileUpdate.bodyFatPercentage = data.bodyFatPercentage;
        }
        
        await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileUpdate),
        });
        fetchUserProfile();
      }
    } catch (error) {
      console.error('Error updating fitness data:', error);
    }
  };

  const addWater = () => {
    const newValue = Math.min(waterIntake + 0.25, dailyWaterGoal); // Add 250ml (0.25L)
    setWaterIntake(newValue);
    updateFitnessData({ waterLiters: newValue });
  };

  const removeWater = () => {
    const newValue = Math.max(waterIntake - 0.25, 0); // Remove 250ml (0.25L)
    setWaterIntake(newValue);
    updateFitnessData({ waterLiters: newValue });
  };
  
  const analyzeFood = async () => {
    if (!foodDescription.trim()) {
      setAnalysisError('Please enter a food description');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError('');

    try {
      // First, analyze the food with AI
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
          // Update totals
          const newCalories = calories + cal;
          const newCarbs = carbs + c;
          const newFats = fats + f;
          const newProtein = protein + p;

          setCalories(newCalories);
          setCarbs(newCarbs);
          setFats(newFats);
          setProtein(newProtein);

          // Update FitnessLog for streak tracking
          updateFitnessData({ 
            calories: newCalories,
            carbs: newCarbs,
            fats: newFats,
            protein: newProtein,
          });

          // Refresh meal history
          fetchMeals();
          setFoodDescription('');
        } else {
          setAnalysisError('Failed to save meal to database');
        }
      } else {
        setAnalysisError(result.error || 'Failed to analyze food');
      }
    } catch (error) {
      console.error('Error analyzing food:', error);
      setAnalysisError('Network error. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const analyzeExercise = async () => {
    if (!exerciseDescription.trim()) {
      setExerciseAnalysisError('Please enter an exercise description');
      return;
    }

    setIsAnalyzingExercise(true);
    setExerciseAnalysisError('');

    try {
      // First, analyze the exercise with AI
      const response = await fetch('/api/exercises/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseDescription }),
      });

      const result = await response.json();

      if (result.success) {
        const exerciseData = result.data;

        // Create sets array for weight training
        let setsArray = [];
        if (exerciseData.category === 'weight-training' && exerciseData.sets && exerciseData.reps) {
          for (let i = 1; i <= exerciseData.sets; i++) {
            setsArray.push({
              setNumber: i,
              weight: exerciseData.weight || 0,
              reps: exerciseData.reps,
              completed: true,
            });
          }
        }

        // Save to exercises collection
        const exerciseResponse = await fetch('/api/exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: exerciseData.name,
            category: exerciseData.category,
            muscleGroup: exerciseData.muscleGroup,
            sets: setsArray,
            duration: exerciseData.duration,
            distance: exerciseData.distance,
            caloriesBurned: exerciseData.caloriesBurned,
            notes: exerciseData.notes,
            isAIAnalyzed: true,
            description: exerciseDescription,
            date: new Date(),
          }),
        });

        const exerciseResult = await exerciseResponse.json();
        
        if (exerciseResult.success) {
          // Update exercise minutes
          const minutesToAdd = exerciseData.duration || (exerciseData.sets ? exerciseData.sets * 2 : 0);
          const newExerciseMinutes = exerciseMinutes + minutesToAdd;
          setExerciseMinutes(newExerciseMinutes);

          // Update FitnessLog for streak tracking
          updateFitnessData({ exerciseMinutes: newExerciseMinutes });

          // Refresh exercise history
          fetchExercises();
          setExerciseDescription('');
        } else {
          setExerciseAnalysisError('Failed to save exercise to database');
        }
      } else {
        setExerciseAnalysisError(result.error || 'Failed to analyze exercise');
      }
    } catch (error) {
      console.error('Error analyzing exercise:', error);
      setExerciseAnalysisError('Network error. Please try again.');
    } finally {
      setIsAnalyzingExercise(false);
    }
  };

  const addExercise = (minutes: number) => {
    const newValue = Math.min(exerciseMinutes + minutes, exerciseGoal);
    setExerciseMinutes(newValue);
    updateFitnessData({ exerciseMinutes: newValue });
  };

  // Get summary data - use MongoDB data if available, otherwise use current day's data
  const getSummaryData = (period: 'day' | 'week' | 'month' | 'year') => {
    if (summaryData && summaryData.period === period) {
      return summaryData;
    }
    
    // Fallback to current data for day view
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
        minutes: exerciseMinutes,
        goal: exerciseGoal,
        percentage: Math.round((exerciseMinutes / exerciseGoal) * 100),
      },
      totalDays: 1,
    };
  };

  const toggleExercise = (exerciseId: string) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  // Save quick-add exercise to database
  const saveQuickAddExercise = async (exerciseName: string, category: 'cardio' | 'weight-training', duration?: number, sets?: number, reps?: string, muscleGroup?: string) => {
    try {
      const setsArray = [];
      if (category === 'weight-training' && sets && reps) {
        // Parse reps (e.g., "8-12" -> 10)
        const repsNum = parseInt(reps.split('-')[0]) || 10;
        for (let i = 1; i <= sets; i++) {
          setsArray.push({
            setNumber: i,
            weight: 0, // User can update later
            reps: repsNum,
            completed: true,
          });
        }
      }

      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: exerciseName,
          category: category,
          muscleGroup: muscleGroup,
          sets: setsArray,
          duration: duration,
          caloriesBurned: duration ? duration * 8 : sets ? sets * 15 : 0, // Rough estimate
          isAIAnalyzed: false,
          date: new Date(),
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh exercises from database (this will recalculate totals and update fitness log)
        await fetchExercises();
      }
    } catch (error) {
      console.error('Error saving quick-add exercise:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Fitness Tracker
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Monitor your daily health and fitness goals
          </p>
        </header>

        {/* Summary Section at Top */}
        

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="hydration" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="hydration">Hydration</TabsTrigger>
                <TabsTrigger value="diet">Diet</TabsTrigger>
                <TabsTrigger value="exercise">Exercise</TabsTrigger>
                <TabsTrigger value="weight">Weight</TabsTrigger>
                <TabsTrigger value="streak">Streak</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
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
                      <div className="text-center py-8 text-muted-foreground">
                        Loading your water intake...
                      </div>
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
                          <Button 
                            variant="outline" 
                            onClick={removeWater} 
                            disabled={waterIntake === 0}
                          >
                            Remove 250ml
                          </Button>
                          <Button variant="outline" onClick={() => {
                            setWaterIntake(0);
                            updateFitnessData({ waterLiters: 0 });
                          }}>
                            Reset
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {Array.from({ length: 16 }).map((_, i) => {
                            const threshold = (i + 1) * 0.25; // Each box represents 250ml
                            return (
                              <div
                                key={i}
                                className={`h-12 md:h-16 rounded-lg border-2 flex items-center justify-center transition-all ${
                                  waterIntake >= threshold
                                    ? "bg-blue-500/20 border-blue-500"
                                    : "bg-muted border-border"
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
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Utensils className="h-5 w-5 text-green-500" />
                          Nutrition Tracking
                        </CardTitle>
                        <CardDescription>AI-powered food analysis with macros</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!isMounted || isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Loading your nutrition data...
                      </div>
                    ) : (
                      <>
                        {/* Meal Type Selector */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Meal Type</label>
                          <MealTypeSelect value={mealType} onChange={setMealType} />
                        </div>

                        {/* AI Food Input */}
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
                            <Button 
                              onClick={analyzeFood} 
                              disabled={isAnalyzing || !foodDescription.trim()}
                            >
                              {isAnalyzing ? 'Analyzing...' : 'Add Food'}
                            </Button>
                          </div>
                          {analysisError && (
                            <div className="text-sm text-red-600">{analysisError}</div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Powered by Gemini AI - Enter any food description for automatic macro calculation
                          </div>
                        </div>

                        {/* Macros Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card className="p-4">
                            <div className="text-xs text-muted-foreground mb-1">Calories</div>
                            <div className="text-2xl font-bold">{calories}</div>
                            <div className="text-xs text-muted-foreground">/ {calorieGoal} kcal</div>
                            <Progress value={(calories / calorieGoal) * 100} className="h-1 mt-2" />
                          </Card>

                          <Card className="p-4">
                            <div className="text-xs text-muted-foreground mb-1">Carbs</div>
                            <div className="text-2xl font-bold">{carbs.toFixed(1)}</div>
                            <div className="text-xs text-muted-foreground">/ {carbsGoal}g</div>
                            <Progress value={(carbs / carbsGoal) * 100} className="h-1 mt-2" />
                          </Card>

                          <Card className="p-4">
                            <div className="text-xs text-muted-foreground mb-1">Fats</div>
                            <div className="text-2xl font-bold">{fats.toFixed(1)}</div>
                            <div className="text-xs text-muted-foreground">/ {fatsGoal}g</div>
                            <Progress value={(fats / fatsGoal) * 100} className="h-1 mt-2" />
                          </Card>

                          <Card className="p-4">
                            <div className="text-xs text-muted-foreground mb-1">Protein</div>
                            <div className="text-2xl font-bold">{protein.toFixed(1)}</div>
                            <div className="text-xs text-muted-foreground">/ {proteinGoal}g</div>
                            <Progress value={(protein / proteinGoal) * 100} className="h-1 mt-2" />
                          </Card>
                        </div>

                        {/* Macro Distribution */}
                        <Card className="p-4 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                          <div className="text-sm font-medium mb-3">Macro Distribution</div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Carbs</span>
                              <span className="font-medium">{((carbs / carbsGoal) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Fats</span>
                              <span className="font-medium">{((fats / fatsGoal) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Protein</span>
                              <span className="font-medium">{((protein / proteinGoal) * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </Card>

                        {/* Meal History */}
                        <div className="border-t pt-4">
                          <MealHistory meals={meals} onDelete={handleDeleteMeal} />
                        </div>

                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setCalories(0);
                            setCarbs(0);
                            setFats(0);
                            setProtein(0);
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
                        <Badge variant={exerciseMinutes >= exerciseGoal ? "default" : "secondary"}>
                          {exerciseMinutes} / {exerciseGoal} min
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isMounted || isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Loading your exercise data...
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{Math.round((exerciseMinutes / exerciseGoal) * 100)}%</span>
                          </div>
                          <Progress value={(exerciseMinutes / exerciseGoal) * 100} className="h-3" />
                        </div>

                        {/* AI Exercise Input */}
                        <div className="space-y-3 border-b pb-4 mb-4">
                          <label className="text-sm font-medium">Describe your workout</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={exerciseDescription}
                              onChange={(e) => setExerciseDescription(e.target.value)}
                              placeholder="e.g., 3 sets of 10 reps bench press at 80kg, or 30 minute run 5km"
                              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              onKeyPress={(e) => e.key === 'Enter' && analyzeExercise()}
                              disabled={isAnalyzingExercise}
                            />
                            <Button 
                              onClick={analyzeExercise} 
                              disabled={isAnalyzingExercise || !exerciseDescription.trim()}
                            >
                              {isAnalyzingExercise ? 'Analyzing...' : 'Add Exercise'}
                            </Button>
                          </div>
                          {exerciseAnalysisError && (
                            <div className="text-sm text-red-600 dark:text-red-400">{exerciseAnalysisError}</div>
                          )}
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Powered by Gemini AI - Enter any exercise description for automatic tracking
                          </div>
                        </div>

                        {/* Exercise History */}
                        <div className="border-b pb-4">
                          <ExerciseHistory exercises={exercises} onDelete={handleDeleteExercise} />
                        </div>

                        {/* Category Selector */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Dumbbell className="h-4 w-4" />
                            Quick Add Exercises
                          </h3>
                          <div className="flex gap-2">
                            <Button
                              variant={exerciseCategory === 'cardio' ? 'default' : 'outline'}
                              onClick={() => setExerciseCategory('cardio')}
                              className="flex-1"
                            >
                              <Heart className="h-4 w-4 mr-2" />
                              Cardio
                            </Button>
                            <Button
                              variant={exerciseCategory === 'weight-training' ? 'default' : 'outline'}
                              onClick={() => setExerciseCategory('weight-training')}
                              className="flex-1"
                            >
                              <Dumbbell className="h-4 w-4 mr-2" />
                              Weight Training
                            </Button>
                          </div>
                        </div>

                        {/* Cardio Exercises */}
                        {exerciseCategory === 'cardio' && (
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold">Cardio Exercises</h3>
                            <div className="grid grid-cols-1 gap-2">
                              {cardioExercises.map((exercise) => (
                                <CardioItem
                                  key={exercise.id}
                                  name={exercise.name}
                                  duration={exercise.duration}
                                  isCompleted={completedExercises.has(exercise.id)}
                                  onToggle={async () => {
                                    const wasCompleted = completedExercises.has(exercise.id);
                                    toggleExercise(exercise.id);
                                    if (!wasCompleted) {
                                      // Save to database and refresh
                                      await saveQuickAddExercise(exercise.name, 'cardio', exercise.duration);
                                    }
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Weight Training Exercises */}
                        {exerciseCategory === 'weight-training' && (
                          <div className="space-y-3">
                            {/* Muscle Group Selector */}
                            <div className="flex gap-2">
                              {weightTrainingCategories.map((category) => (
                                <Button
                                  key={category.id}
                                  size="sm"
                                  variant={selectedMuscleGroup === category.id ? 'default' : 'outline'}
                                  onClick={() => setSelectedMuscleGroup(category.id)}
                                  className="flex-1"
                                >
                                  <span className="mr-1">{category.icon}</span>
                                  {category.name}
                                </Button>
                              ))}
                            </div>

                            {/* Exercise List for Selected Muscle Group */}
                            {weightTrainingCategories
                              .filter(cat => cat.id === selectedMuscleGroup)
                              .map((category) => (
                                <div key={category.id} className="space-y-2">
                                  <h3 className="text-sm font-semibold">{category.name} Exercises</h3>
                                  <div className="grid grid-cols-1 gap-2">
                                    {category.exercises.map((exercise) => (
                                      <ExerciseItem
                                        key={exercise.id}
                                        name={exercise.name}
                                        reps={exercise.reps}
                                        sets={exercise.sets}
                                        isCompleted={completedExercises.has(exercise.id)}
                                        onToggle={async () => {
                                          const wasCompleted = completedExercises.has(exercise.id);
                                          toggleExercise(exercise.id);
                                          if (!wasCompleted) {
                                            // Save to database and refresh
                                            await saveQuickAddExercise(
                                              exercise.name, 
                                              'weight-training', 
                                              undefined, 
                                              exercise.sets, 
                                              exercise.reps,
                                              category.id
                                            );
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
                          setExerciseMinutes(0);
                          setCompletedExercises(new Set());
                          updateFitnessData({ exerciseMinutes: 0 });
                        }} className="w-full">
                          Reset Daily Progress
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Weight Tracking Tab */}
              <TabsContent value="weight" className="space-y-4">
                {userProfile ? (
                  <>
                    {/* Weight Graph - At the Top */}
                    <WeightGraph days={30} targetWeight={userProfile.targetWeight} />
                    
                    <BodyStats
                      currentWeight={todayWeight || userProfile.currentWeight}
                      targetWeight={userProfile.targetWeight}
                      bodyFatPercentage={todayBodyFat || userProfile.bodyFatPercentage}
                      skeletalMuscle={userProfile.skeletalMuscle}
                      visceralFatIndex={userProfile.visceralFatIndex}
                      bmr={userProfile.bmr}
                      dailyCalorieTarget={userProfile.dailyCalorieTarget}
                      dailyProteinTarget={userProfile.dailyProteinTarget}
                      goalType={userProfile.goalType}
                    />
                    
                    {/* Daily Weight Log */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Scale className="h-5 w-5 text-purple-500" />
                          Today's Measurements
                        </CardTitle>
                        <CardDescription>Log your weight and body fat for today</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Weight (kg)</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                step="0.1"
                                value={todayWeight || ''}
                                onChange={(e) => setTodayWeight(parseFloat(e.target.value) || null)}
                                placeholder={userProfile.currentWeight.toString()}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            {todayWeight && (
                              <div className="text-xs text-muted-foreground">
                                {todayWeight > userProfile.currentWeight 
                                  ? `+${(todayWeight - userProfile.currentWeight).toFixed(1)} kg` 
                                  : `${(todayWeight - userProfile.currentWeight).toFixed(1)} kg`}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Body Fat (%)</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                step="0.1"
                                value={todayBodyFat || ''}
                                onChange={(e) => setTodayBodyFat(parseFloat(e.target.value) || null)}
                                placeholder={userProfile.bodyFatPercentage.toString()}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              />
                            </div>
                            {todayBodyFat && (
                              <div className="text-xs text-muted-foreground">
                                {todayBodyFat > userProfile.bodyFatPercentage 
                                  ? `+${(todayBodyFat - userProfile.bodyFatPercentage).toFixed(1)}%` 
                                  : `${(todayBodyFat - userProfile.bodyFatPercentage).toFixed(1)}%`}
                              </div>
                            )}
                          </div>
                        </div>

                        <Button 
                          onClick={async () => {
                            if (todayWeight) {
                              // Save to WeightLog collection
                              await fetch('/api/weight-log', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  date: new Date(),
                                  weight: todayWeight,
                                  bodyFatPercentage: todayBodyFat || undefined,
                                }),
                              });
                              
                              // Also update FitnessLog for today
                              await updateFitnessData({ 
                                weight: todayWeight, 
                                bodyFatPercentage: todayBodyFat || undefined 
                              });
                              
                              // Refresh today's data to show it's saved
                              await fetchTodayData();
                              
                              // Trigger a re-render of the graph by updating a key
                              window.location.reload();
                            }
                          }}
                          disabled={!todayWeight}
                          className="w-full"
                        >
                          Save Today's Measurements
                        </Button>

                        {todayWeight && (
                          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                            <div className="text-sm font-semibold text-green-600">Progress Saved! ✅</div>
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
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-500" />
                      Your Streak
                    </CardTitle>
                    <CardDescription>
                      Complete all 4 daily goals to maintain your streak
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StreakStats logs={streakLogs} />
                  </CardContent>
                </Card>

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
                        <Button
                          size="sm"
                          variant={summaryPeriod === 'day' ? 'default' : 'outline'}
                          onClick={() => setSummaryPeriod('day')}
                        >
                          Day
                        </Button>
                        <Button
                          size="sm"
                          variant={summaryPeriod === 'week' ? 'default' : 'outline'}
                          onClick={() => setSummaryPeriod('week')}
                        >
                          Week
                        </Button>
                        <Button
                          size="sm"
                          variant={summaryPeriod === 'month' ? 'default' : 'outline'}
                          onClick={() => setSummaryPeriod('month')}
                        >
                          Month
                        </Button>
                        <Button
                          size="sm"
                          variant={summaryPeriod === 'year' ? 'default' : 'outline'}
                          onClick={() => setSummaryPeriod('year')}
                        >
                          Year
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Your {summaryPeriod === 'day' ? 'daily' : summaryPeriod === 'week' ? 'weekly' : summaryPeriod === 'month' ? 'monthly' : 'yearly'} fitness overview
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Water Summary */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Droplet className="h-5 w-5 text-blue-500" />
                          <h3 className="font-semibold">Water Intake</h3>
                        </div>
                        <Badge variant={getSummaryData(summaryPeriod).water.percentage >= 100 ? "default" : "secondary"}>
                          {getSummaryData(summaryPeriod).water.percentage}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Consumed</span>
                          <span className="font-medium">
                            {getSummaryData(summaryPeriod).water.consumed.toFixed(2)} / {getSummaryData(summaryPeriod).water.goal.toFixed(2)} L
                          </span>
                        </div>
                        <Progress value={getSummaryData(summaryPeriod).water.percentage} className="h-2" />
                      </div>
                    </div>

                    {/* Calories Summary */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Utensils className="h-5 w-5 text-green-500" />
                          <h3 className="font-semibold">Calorie Intake</h3>
                        </div>
                        <Badge variant={getSummaryData(summaryPeriod).calories.percentage >= 100 ? "default" : "secondary"}>
                          {getSummaryData(summaryPeriod).calories.percentage}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Consumed</span>
                          <span className="font-medium">
                            {getSummaryData(summaryPeriod).calories.consumed.toLocaleString()} / {getSummaryData(summaryPeriod).calories.goal.toLocaleString()} kcal
                          </span>
                        </div>
                        <Progress value={getSummaryData(summaryPeriod).calories.percentage} className="h-2" />
                      </div>
                    </div>

                    {/* Exercise Summary */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-5 w-5 text-purple-500" />
                          <h3 className="font-semibold">Exercise Time</h3>
                        </div>
                        <Badge variant={getSummaryData(summaryPeriod).exercise.percentage >= 100 ? "default" : "secondary"}>
                          {getSummaryData(summaryPeriod).exercise.percentage}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Completed</span>
                          <span className="font-medium">
                            {getSummaryData(summaryPeriod).exercise.minutes.toLocaleString()} / {getSummaryData(summaryPeriod).exercise.goal.toLocaleString()} min
                          </span>
                        </div>
                        <Progress value={getSummaryData(summaryPeriod).exercise.percentage} className="h-2" />
                      </div>
                    </div>

                    {/* Overall Stats */}
                    <div className="pt-4 border-t">
                      <div className="text-center space-y-2">
                        <div className="text-4xl font-bold text-primary">
                          {Math.round(
                            (getSummaryData(summaryPeriod).water.percentage +
                              getSummaryData(summaryPeriod).calories.percentage +
                              getSummaryData(summaryPeriod).exercise.percentage) / 3
                          )}%
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Overall {summaryPeriod === 'day' ? 'daily' : summaryPeriod === 'week' ? 'weekly' : summaryPeriod === 'month' ? 'monthly' : 'yearly'} completion
                        </p>
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="text-center space-y-1 p-3 bg-blue-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-blue-500">
                          {getSummaryData(summaryPeriod).water.consumed.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Liters</div>
                      </div>
                      <div className="text-center space-y-1 p-3 bg-green-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-green-500">
                          {(getSummaryData(summaryPeriod).calories.consumed / 1000).toFixed(1)}k
                        </div>
                        <div className="text-xs text-muted-foreground">Calories</div>
                      </div>
                      <div className="text-center space-y-1 p-3 bg-purple-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-purple-500">
                          {getSummaryData(summaryPeriod).exercise.minutes}
                        </div>
                        <div className="text-xs text-muted-foreground">Minutes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Calendar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SidebarCalendar
                  logs={streakLogs}
                  selectedDate={date}
                  onSelectDate={setDate}
                />
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
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Water</span>
                  <span className="text-sm font-medium">{dailyWaterGoal} L</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Calories</span>
                  <span className="text-sm font-medium">{calorieGoal} kcal</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Exercise</span>
                  <span className="text-sm font-medium">{exerciseGoal} min</span>
                </div>
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
                  <div className="text-center py-4 text-muted-foreground text-xs">
                    Loading...
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">
                      {Math.round(
                        ((waterIntake / dailyWaterGoal + calories / calorieGoal + exerciseMinutes / exerciseGoal) / 3) * 100
                      )}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average completion across all goals
                    </p>
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
