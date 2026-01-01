import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Scale, TrendingDown, Target, Flame } from "lucide-react";

interface BodyStatsProps {
  currentWeight: number;
  targetWeight: number;
  bodyFatPercentage: number;
  skeletalMuscle: number;
  visceralFatIndex: number;
  bmr: number;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  goalType: string;
}

export function BodyStats({
  currentWeight,
  targetWeight,
  bodyFatPercentage,
  skeletalMuscle,
  visceralFatIndex,
  bmr,
  dailyCalorieTarget,
  dailyProteinTarget,
  goalType,
}: BodyStatsProps) {
  const weightToLose = currentWeight - targetWeight;
  
  // Calculate progress percentage (how close we are to goal)
  // If we need to lose weight, calculate progress towards target
  const totalWeightToLose = Math.abs(weightToLose);
  const progressPercentage = totalWeightToLose > 0 
    ? Math.min(100, Math.max(0, ((totalWeightToLose - Math.abs(weightToLose)) / totalWeightToLose) * 100))
    : 100;
  
  const leanMass = currentWeight * (1 - bodyFatPercentage / 100);
  const fatMass = currentWeight - leanMass;
  
  return (
    <div className="space-y-4">
      {/* Current Stats Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-500" />
              Body Composition
            </CardTitle>
            <Badge variant={goalType === 'cut' ? 'destructive' : goalType === 'bulk' ? 'default' : 'secondary'}>
              {goalType === 'cut' ? '🔥 Cutting' : goalType === 'bulk' ? '💪 Bulking' : '⚖️ Maintaining'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Weight Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Weight Progress</span>
              <div className="text-right">
                <div className="text-2xl font-bold">{currentWeight.toFixed(1)} kg</div>
                <div className="text-xs text-muted-foreground">Target: {targetWeight} kg</div>
              </div>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{weightToLose > 0 ? `${weightToLose.toFixed(1)} kg to lose` : weightToLose < 0 ? `${Math.abs(weightToLose).toFixed(1)} kg to gain` : 'Goal reached!'}</span>
              <span>{Math.round(progressPercentage)}% to goal</span>
            </div>
          </div>

          {/* Body Composition Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <div className="text-xs text-muted-foreground">Body Fat</div>
              <div className="text-2xl font-bold text-orange-500">{bodyFatPercentage}%</div>
              <div className="text-xs text-muted-foreground">{fatMass.toFixed(1)} kg</div>
            </div>
            
            <div className="space-y-1 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-xs text-muted-foreground">Lean Mass</div>
              <div className="text-2xl font-bold text-green-500">{leanMass.toFixed(1)} kg</div>
              <div className="text-xs text-muted-foreground">{(100 - bodyFatPercentage).toFixed(1)}%</div>
            </div>

            <div className="space-y-1 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="text-xs text-muted-foreground">Skeletal Muscle</div>
              <div className="text-2xl font-bold text-blue-500">{skeletalMuscle.toFixed(1)} kg</div>
              <div className="text-xs text-muted-foreground">💪 High Base</div>
            </div>

            <div className="space-y-1 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="text-xs text-muted-foreground">Visceral Fat</div>
              <div className="text-2xl font-bold text-red-500">{visceralFatIndex}</div>
              <div className="text-xs text-muted-foreground">
                {visceralFatIndex < 10 ? '✅ Normal' : '⚠️ High'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Targets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Daily Targets
          </CardTitle>
          <CardDescription>Personalized nutrition goals for cutting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">BMR</span>
                <span className="font-semibold">{bmr} kcal</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Your base metabolism (at rest)
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Daily Calories</span>
                <span className="font-semibold text-orange-500">{dailyCalorieTarget} kcal</span>
              </div>
              <div className="text-xs text-muted-foreground">
                For fat loss while keeping muscle
              </div>
            </div>

            <div className="space-y-2 col-span-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Protein Target</span>
                <span className="font-semibold text-blue-500">{dailyProteinTarget}g</span>
              </div>
              <Progress value={(dailyProteinTarget / 200) * 100} className="h-2" />
              <div className="text-xs text-muted-foreground">
                Critical: Protects your {skeletalMuscle.toFixed(1)}kg muscle mass
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Cutting Strategy
            </div>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Lose 0.5-0.75 kg/week to protect muscle</li>
              <li>• Keep lifting heavy 3-4x/week</li>
              <li>• Zone 2 cardio 30min, 3-4x/week for visceral fat</li>
              <li>• Reduce carbs on rest days</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
