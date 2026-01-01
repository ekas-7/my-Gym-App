"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Droplet, Utensils, Dumbbell, TrendingUp, Target, Calendar as CalendarIcon, Heart, Scale } from "lucide-react";
import { ExerciseItem } from "@/components/exercise-item";
import { CardioItem } from "@/components/cardio-item";
import { BodyStats } from "@/components/body-stats";
import { cardioExercises, weightTrainingCategories } from "@/lib/exercises";

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

  // Exercise state
  const [exerciseMinutes, setExerciseMinutes] = useState(0);
  const [exerciseGoal, setExerciseGoal] = useState(60); // Will be updated from profile

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

  // Fetch today's fitness data on mount
  useEffect(() => {
    fetchTodayData();
    fetchUserProfile();
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

  const updateFitnessData = async (data: { waterLiters?: number; calories?: number; exerciseMinutes?: number; weight?: number; bodyFatPercentage?: number }) => {
    try {
      await fetch('/api/fitness', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      // Refresh summary after update
      fetchSummaryData();
      
      // Update profile if weight changed
      if (data.weight && userProfile) {
        await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentWeight: data.weight }),
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
  
  const addCalories = (amount: number) => {
    const newValue = Math.min(calories + amount, calorieGoal);
    setCalories(newValue);
    updateFitnessData({ calories: newValue });
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
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="hydration">Hydration</TabsTrigger>
                <TabsTrigger value="diet">Diet</TabsTrigger>
                <TabsTrigger value="exercise">Exercise</TabsTrigger>
                <TabsTrigger value="weight">Weight</TabsTrigger>
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
                      <Badge variant={waterIntake >= dailyWaterGoal ? "default" : "secondary"}>
                        {waterIntake.toFixed(2)} / {dailyWaterGoal} L
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                          Calorie Intake
                        </CardTitle>
                        <CardDescription>Monitor your daily calorie consumption</CardDescription>
                      </div>
                      <Badge variant={calories >= calorieGoal ? "default" : "secondary"}>
                        {calories} / {calorieGoal} kcal
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{Math.round((calories / calorieGoal) * 100)}%</span>
                      </div>
                      <Progress value={(calories / calorieGoal) * 100} className="h-3" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={() => addCalories(200)} 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-start"
                      >
                        <span className="font-semibold">Salad</span>
                        <span className="text-xs text-muted-foreground">+200 kcal</span>
                      </Button>
                      <Button 
                        onClick={() => addCalories(400)} 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-start"
                      >
                        <span className="font-semibold">Chicken</span>
                        <span className="text-xs text-muted-foreground">+400 kcal</span>
                      </Button>
                      <Button 
                        onClick={() => addCalories(300)} 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-start"
                      >
                        <span className="font-semibold">Rice</span>
                        <span className="text-xs text-muted-foreground">+300 kcal</span>
                      </Button>
                      <Button 
                        onClick={() => addCalories(150)} 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-start"
                      >
                        <span className="font-semibold">Smoothie</span>
                        <span className="text-xs text-muted-foreground">+150 kcal</span>
                      </Button>
                    </div>
                    <Button variant="outline" onClick={() => {
                      setCalories(0);
                      updateFitnessData({ calories: 0 });
                    }} className="w-full">
                      Reset Calories
                    </Button>
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
                        <CardDescription>Choose your workout type and log exercises</CardDescription>
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

                    {/* Category Selector */}
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
                              onToggle={() => {
                                toggleExercise(exercise.id);
                                if (!completedExercises.has(exercise.id)) {
                                  addExercise(exercise.duration);
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
                                    onToggle={() => {
                                      toggleExercise(exercise.id);
                                      if (!completedExercises.has(exercise.id)) {
                                        // Assume 2 minutes per set
                                        addExercise(exercise.sets * 2);
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
                      Reset All Exercises
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Weight Tracking Tab */}
              <TabsContent value="weight" className="space-y-4">
                {userProfile ? (
                  <>
                    <BodyStats
                      currentWeight={userProfile.currentWeight}
                      targetWeight={userProfile.targetWeight}
                      bodyFatPercentage={userProfile.bodyFatPercentage}
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
                          onClick={() => {
                            if (todayWeight) {
                              updateFitnessData({ 
                                weight: todayWeight, 
                                bodyFatPercentage: todayBodyFat || undefined 
                              });
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
                {isMounted ? (
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md"
                  />
                ) : (
                  <div className="h-[280px] flex items-center justify-center">
                    <div className="text-sm text-muted-foreground">Loading calendar...</div>
                  </div>
                )}
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
