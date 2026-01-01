"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Droplet, Utensils, Dumbbell, TrendingUp, Target, Calendar as CalendarIcon } from "lucide-react";

export default function Home() {
  // Date state - fix hydration issue
  const [date, setDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    setDate(new Date());
  }, []);

  // Hydration state
  const [waterIntake, setWaterIntake] = useState(0);
  const dailyWaterGoal = 8; // 8 glasses

  // Diet state
  const [calories, setCalories] = useState(0);
  const calorieGoal = 2000;

  // Exercise state
  const [exerciseMinutes, setExerciseMinutes] = useState(0);
  const exerciseGoal = 60;

  const addWater = () => setWaterIntake(Math.min(waterIntake + 1, dailyWaterGoal));
  const addCalories = (amount: number) => setCalories(Math.min(calories + amount, calorieGoal));
  const addExercise = (minutes: number) => setExerciseMinutes(Math.min(exerciseMinutes + minutes, exerciseGoal));

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Droplet className="h-4 w-4 text-blue-500" />
                Hydration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">{waterIntake}</div>
                  <div className="text-sm text-muted-foreground">/ {dailyWaterGoal} glasses</div>
                </div>
                <Progress value={(waterIntake / dailyWaterGoal) * 100} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {Math.round((waterIntake / dailyWaterGoal) * 100)}% Complete
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Utensils className="h-4 w-4 text-green-500" />
                Nutrition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">{calories}</div>
                  <div className="text-sm text-muted-foreground">/ {calorieGoal} kcal</div>
                </div>
                <Progress value={(calories / calorieGoal) * 100} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {Math.round((calories / calorieGoal) * 100)}% Complete
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-purple-500" />
                Exercise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">{exerciseMinutes}</div>
                  <div className="text-sm text-muted-foreground">/ {exerciseGoal} min</div>
                </div>
                <Progress value={(exerciseMinutes / exerciseGoal) * 100} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {Math.round((exerciseMinutes / exerciseGoal) * 100)}% Complete
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="hydration" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="hydration">Hydration</TabsTrigger>
                <TabsTrigger value="diet">Diet</TabsTrigger>
                <TabsTrigger value="exercise">Exercise</TabsTrigger>
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
                        {waterIntake} / {dailyWaterGoal} glasses
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
                        Add Glass
                      </Button>
                      <Button variant="outline" onClick={() => setWaterIntake(0)}>
                        Reset
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: dailyWaterGoal }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-12 md:h-16 rounded-lg border-2 flex items-center justify-center transition-all ${
                            i < waterIntake
                              ? "bg-blue-500/20 border-blue-500"
                              : "bg-muted border-border"
                          }`}
                        >
                          {i < waterIntake && <Droplet className="h-5 w-5 text-blue-500" />}
                        </div>
                      ))}
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
                    <Button variant="outline" onClick={() => setCalories(0)} className="w-full">
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
                          Exercise Time
                        </CardTitle>
                        <CardDescription>Log your daily workout sessions</CardDescription>
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
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={() => addExercise(15)} 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-start"
                      >
                        <span className="font-semibold">Running</span>
                        <span className="text-xs text-muted-foreground">15 minutes</span>
                      </Button>
                      <Button 
                        onClick={() => addExercise(20)} 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-start"
                      >
                        <span className="font-semibold">Weights</span>
                        <span className="text-xs text-muted-foreground">20 minutes</span>
                      </Button>
                      <Button 
                        onClick={() => addExercise(10)} 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-start"
                      >
                        <span className="font-semibold">Yoga</span>
                        <span className="text-xs text-muted-foreground">10 minutes</span>
                      </Button>
                      <Button 
                        onClick={() => addExercise(30)} 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-start"
                      >
                        <span className="font-semibold">Cycling</span>
                        <span className="text-xs text-muted-foreground">30 minutes</span>
                      </Button>
                      <Button 
                        onClick={() => addExercise(15)} 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-start"
                      >
                        <span className="font-semibold">Swimming</span>
                        <span className="text-xs text-muted-foreground">15 minutes</span>
                      </Button>
                      <Button 
                        onClick={() => addExercise(10)} 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-start"
                      >
                        <span className="font-semibold">Stretching</span>
                        <span className="text-xs text-muted-foreground">10 minutes</span>
                      </Button>
                    </div>
                    <Button variant="outline" onClick={() => setExerciseMinutes(0)} className="w-full">
                      Reset Exercise
                    </Button>
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
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md"
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
                  <span className="text-sm font-medium">{dailyWaterGoal} glasses</span>
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
