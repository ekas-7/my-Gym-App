import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FitnessLog from '@/models/FitnessLog';

export const dynamic = 'force-dynamic';

// GET /api/fitness/streak - Get historical fitness data for streak visualization
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '90'); // Default: 90 days

    // Calculate the start date
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Fetch logs from the database
    const logs = await FitnessLog.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ date: -1 })
      .lean();

    // Calculate statistics
    const currentStreakLogs = await FitnessLog.find().sort({ date: -1 }).lean();
    
    let currentStreak = 0;
    let longestStreak = 0;
    let currentRun = 0;
    let maxRun = 0;

    // Calculate current streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < currentStreakLogs.length; i++) {
      const log = currentStreakLogs[i];
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (logDate.getTime() === expectedDate.getTime() && log.isStreakDay) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    // Calculate longest streak (all-time)
    const allLogs = await FitnessLog.find().sort({ date: 1 }).lean();
    let previousDate: Date | null = null;

    for (const log of allLogs) {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);

      if (!log.isStreakDay) {
        currentRun = 0;
        previousDate = null;
        continue;
      }

      if (previousDate === null) {
        currentRun = 1;
      } else {
        const expectedDate = new Date(previousDate);
        expectedDate.setDate(previousDate.getDate() + 1);

        if (logDate.getTime() === expectedDate.getTime()) {
          currentRun++;
        } else {
          currentRun = 1;
        }
      }

      maxRun = Math.max(maxRun, currentRun);
      previousDate = logDate;
    }

    longestStreak = maxRun;

    // Count active days and perfect days
    const activeDays = logs.filter((log) => log.goalsCompleted > 0).length;
    const perfectDays = logs.filter((log) => log.isStreakDay).length;

    return NextResponse.json({
      success: true,
      data: {
        logs: logs.map((log) => ({
          _id: log._id?.toString(),
          date: log.date,
          goalsCompleted: log.goalsCompleted,
          totalGoals: log.totalGoals,
          isStreakDay: log.isStreakDay,
          waterLiters: log.waterLiters,
          waterGoal: log.waterGoal,
          calories: log.calories,
          calorieGoal: log.calorieGoal,
          exerciseMinutes: log.exerciseMinutes,
          exerciseGoal: log.exerciseGoal,
          weight: log.weight,
        })),
        stats: {
          currentStreak,
          longestStreak,
          activeDays,
          perfectDays,
          totalDays: days,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching streak data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch streak data' },
      { status: 500 }
    );
  }
}
