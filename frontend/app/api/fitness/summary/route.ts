import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FitnessLog from '@/models/FitnessLog';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'day'; // day, week, month, year

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = new Date(today);

    if (period === 'week') {
      // Start from Monday of current week
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start
      startDate.setDate(today.getDate() - diff);
    } else if (period === 'month') {
      startDate.setDate(1); // First day of current month
    } else if (period === 'year') {
      startDate.setMonth(0, 1); // January 1st of current year
    }

    const logs = await FitnessLog.find({
      date: { $gte: startDate },
    }).sort({ date: -1 });

    // Calculate summary
    const summary = {
      period,
      water: {
        consumed: 0,
        goal: 0,
        percentage: 0,
      },
      calories: {
        consumed: 0,
        goal: 0,
        percentage: 0,
      },
      exercise: {
        minutes: 0,
        goal: 0,
        percentage: 0,
      },
      totalDays: logs.length,
    };

    // Sum up consumed values
    logs.forEach((log) => {
      summary.water.consumed += log.waterLiters;
      summary.calories.consumed += log.calories;
      summary.exercise.minutes += log.exerciseMinutes;
    });

    // For goals, use the average daily goal (not sum)
    // This way for "day" we get 4L, not 4L * number of days
    if (logs.length > 0) {
      const totalWaterGoal = logs.reduce((sum, log) => sum + log.waterGoal, 0);
      const totalCalorieGoal = logs.reduce((sum, log) => sum + log.calorieGoal, 0);
      const totalExerciseGoal = logs.reduce((sum, log) => sum + log.exerciseGoal, 0);
      
      summary.water.goal = totalWaterGoal / logs.length;
      summary.calories.goal = totalCalorieGoal / logs.length;
      summary.exercise.goal = totalExerciseGoal / logs.length;
      
      // For percentage, compare total consumed vs (average daily goal * number of days)
      summary.water.percentage = Math.round((summary.water.consumed / (summary.water.goal * logs.length)) * 100);
      summary.calories.percentage = Math.round((summary.calories.consumed / (summary.calories.goal * logs.length)) * 100);
      summary.exercise.percentage = Math.round((summary.exercise.minutes / (summary.exercise.goal * logs.length)) * 100);
    }

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch summary' },
      { status: 500 }
    );
  }
}
