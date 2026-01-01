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
    let endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999); // End of today by default

    if (period === 'day') {
      // Just today - startDate is already today at 00:00:00
      // endDate is already today at 23:59:59
    } else if (period === 'week') {
      // Start from Monday of current week
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start
      startDate.setDate(today.getDate() - diff);
      // endDate stays as today
    } else if (period === 'month') {
      startDate.setDate(1); // First day of current month
      // endDate stays as today
    } else if (period === 'year') {
      startDate.setMonth(0, 1); // January 1st of current year
      // endDate stays as today
    }

    // Query with both start and end date to avoid future data
    const logs = await FitnessLog.find({
      date: { 
        $gte: startDate,
        $lte: endDate 
      },
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
      totalDays: logs.length || 1, // At least 1 day
    };

    if (logs.length > 0) {
      // Sum up consumed values
      logs.forEach((log) => {
        summary.water.consumed += log.waterLiters || 0;
        summary.calories.consumed += log.calories || 0;
        summary.exercise.minutes += log.exerciseMinutes || 0;
      });

      // Calculate average daily goal from all logs
      const avgWaterGoal = logs.reduce((sum, log) => sum + (log.waterGoal || 4), 0) / logs.length;
      const avgCalorieGoal = logs.reduce((sum, log) => sum + (log.calorieGoal || 2000), 0) / logs.length;
      const avgExerciseGoal = logs.reduce((sum, log) => sum + (log.exerciseGoal || 60), 0) / logs.length;
      
      // For display: show average daily goal (this is what user expects to see)
      summary.water.goal = avgWaterGoal;
      summary.calories.goal = avgCalorieGoal;
      summary.exercise.goal = avgExerciseGoal;
      
      // For percentage: compare total consumed vs total expected (goal * days)
      const totalExpectedWater = avgWaterGoal * logs.length;
      const totalExpectedCalories = avgCalorieGoal * logs.length;
      const totalExpectedExercise = avgExerciseGoal * logs.length;
      
      summary.water.percentage = Math.round((summary.water.consumed / totalExpectedWater) * 100) || 0;
      summary.calories.percentage = Math.round((summary.calories.consumed / totalExpectedCalories) * 100) || 0;
      summary.exercise.percentage = Math.round((summary.exercise.minutes / totalExpectedExercise) * 100) || 0;
    } else {
      // No logs found - use defaults
      summary.water.goal = 4;
      summary.calories.goal = 2000;
      summary.exercise.goal = 60;
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
