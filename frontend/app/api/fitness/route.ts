import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FitnessLog, { IFitnessLog } from '@/models/FitnessLog';

// Helper function to calculate goals completed
function calculateGoalsCompleted(log: IFitnessLog): {
  goalsCompleted: number;
  totalGoals: number;
  isStreakDay: boolean;
} {
  let completed = 0;
  const total = 3; // water, calories, exercise

  // Goal 1: Water intake met
  if (log.waterLiters >= log.waterGoal) {
    completed++;
  }

  // Goal 2: Calorie target met (within 10% tolerance)
  const calorieTolerance = log.calorieGoal * 0.1;
  if (
    log.calories >= log.calorieGoal - calorieTolerance &&
    log.calories <= log.calorieGoal + calorieTolerance
  ) {
    completed++;
  }

  // Goal 3: Exercise calories burned met
  if (log.exerciseCalories >= log.exerciseGoal) {
    completed++;
  }

  // Streak day = all goals completed
  const isStreakDay = completed === total;

  return {
    goalsCompleted: completed,
    totalGoals: total,
    isStreakDay,
  };
}

// GET: Fetch today's fitness log or create a new one
export async function GET() {
  try {
    await dbConnect();

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let fitnessLog = await FitnessLog.findOne({
      date: { $gte: today, $lt: tomorrow },
    });

    if (!fitnessLog) {
      // Create a new log for today
      fitnessLog = await FitnessLog.create({
        date: today,
        waterLiters: 0,
        waterGoal: 4,
        calories: 0,
        calorieGoal: 2000,
        exerciseCalories: 0,
        exerciseGoal: 500,
      });
    }

    return NextResponse.json({ success: true, data: fitnessLog });
  } catch (error) {
    console.error('Error fetching fitness log:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fitness log' },
      { status: 500 }
    );
  }
}

// POST: Create a new fitness log
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const fitnessLog = await FitnessLog.create(body);

    return NextResponse.json({ success: true, data: fitnessLog }, { status: 201 });
  } catch (error) {
    console.error('Error creating fitness log:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create fitness log' },
      { status: 500 }
    );
  }
}

// PUT: Update today's fitness log
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // First, get the current log to merge with updates
    let currentLog = await FitnessLog.findOne({
      date: { $gte: today, $lt: tomorrow },
    });

    if (!currentLog) {
      // Create default log if doesn't exist
      currentLog = await FitnessLog.create({
        date: today,
        waterLiters: 0,
        waterGoal: 4,
        calories: 0,
        calorieGoal: 2000,
        exerciseCalories: 0,
        exerciseGoal: 500,
      });
    }

    // Merge the update with existing data
    const updatedData = {
      waterLiters: body.waterLiters ?? currentLog.waterLiters,
      waterGoal: body.waterGoal ?? currentLog.waterGoal,
      calories: body.calories ?? currentLog.calories,
      calorieGoal: body.calorieGoal ?? currentLog.calorieGoal,
      carbs: body.carbs ?? currentLog.carbs,
      carbsGoal: body.carbsGoal ?? currentLog.carbsGoal,
      fats: body.fats ?? currentLog.fats,
      fatsGoal: body.fatsGoal ?? currentLog.fatsGoal,
      protein: body.protein ?? currentLog.protein,
      proteinGoal: body.proteinGoal ?? currentLog.proteinGoal,
      exerciseCalories: body.exerciseCalories ?? currentLog.exerciseCalories,
      exerciseGoal: body.exerciseGoal ?? currentLog.exerciseGoal,
      exercises: body.exercises ?? currentLog.exercises,
      weight: body.weight ?? currentLog.weight,
      bodyFatPercentage: body.bodyFatPercentage ?? currentLog.bodyFatPercentage,
    };

    // Calculate streak status based on merged data
    const streakStatus = calculateGoalsCompleted(updatedData as IFitnessLog);

    // Update with all data including streak info
    const fitnessLog = await FitnessLog.findOneAndUpdate(
      { date: { $gte: today, $lt: tomorrow } },
      {
        ...updatedData,
        goalsCompleted: streakStatus.goalsCompleted,
        totalGoals: streakStatus.totalGoals,
        isStreakDay: streakStatus.isStreakDay,
      },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: fitnessLog });
  } catch (error) {
    console.error('Error updating fitness log:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update fitness log' },
      { status: 500 }
    );
  }
}
