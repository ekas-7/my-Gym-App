import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FitnessLog from '@/models/FitnessLog';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'day'; // day, month, year

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = new Date(today);

    if (period === 'month') {
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

    logs.forEach((log) => {
      summary.water.consumed += log.waterLiters;
      summary.water.goal += log.waterGoal;
      summary.calories.consumed += log.calories;
      summary.calories.goal += log.calorieGoal;
      summary.exercise.minutes += log.exerciseMinutes;
      summary.exercise.goal += log.exerciseGoal;
    });

    if (logs.length > 0) {
      summary.water.percentage = Math.round((summary.water.consumed / summary.water.goal) * 100);
      summary.calories.percentage = Math.round((summary.calories.consumed / summary.calories.goal) * 100);
      summary.exercise.percentage = Math.round((summary.exercise.minutes / summary.exercise.goal) * 100);
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
