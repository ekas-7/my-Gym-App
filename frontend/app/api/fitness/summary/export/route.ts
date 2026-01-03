import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FitnessLog from '@/models/FitnessLog';
import Meal from '@/models/Meal';
import Exercise from '@/models/Exercise';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'day';
    const format = searchParams.get('format') || 'json'; // json, csv

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = new Date(today);
    let periodLabel = '';

    if (period === 'day') {
      periodLabel = 'Today';
    } else if (period === 'week') {
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate.setDate(today.getDate() - diff);
      periodLabel = 'This Week';
    } else if (period === 'month') {
      startDate.setDate(1);
      periodLabel = 'This Month';
    } else if (period === 'year') {
      startDate.setMonth(0, 1);
      periodLabel = 'This Year';
    }

    // Fetch all data
    const logs = await FitnessLog.find({
      date: { $gte: startDate },
    }).sort({ date: 1 });

    const meals = await Meal.find({
      date: { $gte: startDate },
    }).sort({ date: 1 });

    const exercises = await Exercise.find({
      date: { $gte: startDate },
    }).sort({ date: 1 });

    // Calculate totals
    const totals = {
      waterConsumed: 0,
      waterGoal: 0,
      caloriesConsumed: 0,
      calorieGoal: 0,
      exerciseCalories: 0,
      exerciseGoal: 0,
      carbs: 0,
      fats: 0,
      protein: 0,
      streakDays: 0,
    };

    logs.forEach((log) => {
      totals.waterConsumed += log.waterLiters || 0;
      totals.waterGoal += log.waterGoal || 0;
      totals.caloriesConsumed += log.calories || 0;
      totals.calorieGoal += log.calorieGoal || 0;
      totals.exerciseCalories += log.exerciseCalories || 0;
      totals.exerciseGoal += log.exerciseGoal || 0;
      totals.carbs += log.carbs || 0;
      totals.fats += log.fats || 0;
      totals.protein += log.protein || 0;
      if (log.isStreakDay) totals.streakDays++;
    });

    if (format === 'csv') {
      // Generate CSV
      let csv = '';
      
      // Summary section
      csv += `Fitness Summary Report - ${periodLabel}\n`;
      csv += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
      
      csv += `SUMMARY\n`;
      csv += `Period,${periodLabel}\n`;
      csv += `Days Tracked,${logs.length}\n`;
      csv += `Streak Days,${totals.streakDays}\n\n`;
      
      csv += `HYDRATION\n`;
      csv += `Total Water (L),${totals.waterConsumed.toFixed(2)}\n`;
      csv += `Daily Average (L),${(totals.waterConsumed / Math.max(logs.length, 1)).toFixed(2)}\n`;
      csv += `Goal Completion %,${Math.round((totals.waterConsumed / Math.max(totals.waterGoal, 1)) * 100)}\n\n`;
      
      csv += `NUTRITION\n`;
      csv += `Total Calories,${totals.caloriesConsumed}\n`;
      csv += `Daily Average Calories,${Math.round(totals.caloriesConsumed / Math.max(logs.length, 1))}\n`;
      csv += `Total Carbs (g),${Math.round(totals.carbs)}\n`;
      csv += `Total Fats (g),${Math.round(totals.fats)}\n`;
      csv += `Total Protein (g),${Math.round(totals.protein)}\n\n`;
      
      csv += `EXERCISE\n`;
      csv += `Total Calories,${totals.exerciseCalories}\n`;
      csv += `Daily Average (cal),${Math.round(totals.exerciseCalories / Math.max(logs.length, 1))}\n`;
      csv += `Goal Completion %,${Math.round((totals.exerciseCalories / Math.max(totals.exerciseGoal, 1)) * 100)}\n\n`;

      // Daily breakdown
      csv += `\nDAILY BREAKDOWN\n`;
      csv += `Date,Water (L),Calories,Carbs (g),Fats (g),Protein (g),Exercise (cal),Streak Day\n`;
      logs.forEach((log) => {
        csv += `${new Date(log.date).toLocaleDateString()},`;
        csv += `${(log.waterLiters || 0).toFixed(2)},`;
        csv += `${log.calories || 0},`;
        csv += `${Math.round(log.carbs || 0)},`;
        csv += `${Math.round(log.fats || 0)},`;
        csv += `${Math.round(log.protein || 0)},`;
        csv += `${log.exerciseCalories || 0},`;
        csv += `${log.isStreakDay ? 'Yes' : 'No'}\n`;
      });

      // Meals section
      if (meals.length > 0) {
        csv += `\nMEALS LOG\n`;
        csv += `Date,Time,Meal Type,Description,Calories,Carbs (g),Fats (g),Protein (g)\n`;
        meals.forEach((meal) => {
          csv += `${new Date(meal.date).toLocaleDateString()},`;
          csv += `${new Date(meal.timestamp || meal.date).toLocaleTimeString()},`;
          csv += `${meal.mealType || 'Other'},`;
          csv += `"${(meal.description || '').replace(/"/g, '""')}",`;
          csv += `${meal.calories || 0},`;
          csv += `${Math.round(meal.carbs || 0)},`;
          csv += `${Math.round(meal.fats || 0)},`;
          csv += `${Math.round(meal.protein || 0)}\n`;
        });
      }

      // Exercises section
      if (exercises.length > 0) {
        csv += `\nEXERCISE LOG\n`;
        csv += `Date,Exercise Name,Category,Muscle Group,Duration (min),Distance (km),Calories Burned\n`;
        exercises.forEach((exercise) => {
          csv += `${new Date(exercise.date).toLocaleDateString()},`;
          csv += `"${(exercise.name || '').replace(/"/g, '""')}",`;
          csv += `${exercise.category || ''},`;
          csv += `${exercise.muscleGroup || ''},`;
          csv += `${exercise.duration || 0},`;
          csv += `${exercise.distance || 0},`;
          csv += `${exercise.caloriesBurned || 0}\n`;
        });
      }

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="fitness-report-${period}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Return JSON format
    const exportData = {
      report: {
        title: `Fitness Summary Report - ${periodLabel}`,
        generatedOn: new Date().toISOString(),
        period,
        periodLabel,
      },
      summary: {
        daysTracked: logs.length,
        streakDays: totals.streakDays,
        hydration: {
          totalWater: totals.waterConsumed,
          dailyAverage: totals.waterConsumed / Math.max(logs.length, 1),
          goalCompletion: Math.round((totals.waterConsumed / Math.max(totals.waterGoal, 1)) * 100),
        },
        nutrition: {
          totalCalories: totals.caloriesConsumed,
          dailyAverage: Math.round(totals.caloriesConsumed / Math.max(logs.length, 1)),
          totalCarbs: Math.round(totals.carbs),
          totalFats: Math.round(totals.fats),
          totalProtein: Math.round(totals.protein),
        },
        exercise: {
          totalCalories: totals.exerciseCalories,
          dailyAverage: Math.round(totals.exerciseCalories / Math.max(logs.length, 1)),
          goalCompletion: Math.round((totals.exerciseCalories / Math.max(totals.exerciseGoal, 1)) * 100),
        },
      },
      dailyLogs: logs.map((log) => ({
        date: new Date(log.date).toISOString().split('T')[0],
        water: log.waterLiters || 0,
        calories: log.calories || 0,
        carbs: Math.round(log.carbs || 0),
        fats: Math.round(log.fats || 0),
        protein: Math.round(log.protein || 0),
        exercise: log.exerciseCalories || 0,
        isStreakDay: log.isStreakDay || false,
      })),
      meals: meals.map((meal) => ({
        date: new Date(meal.date).toISOString().split('T')[0],
        time: new Date(meal.timestamp || meal.date).toLocaleTimeString(),
        mealType: meal.mealType || 'other',
        description: meal.description || '',
        calories: meal.calories || 0,
        carbs: Math.round(meal.carbs || 0),
        fats: Math.round(meal.fats || 0),
        protein: Math.round(meal.protein || 0),
      })),
      exercises: exercises.map((exercise) => ({
        date: new Date(exercise.date).toISOString().split('T')[0],
        name: exercise.name || '',
        category: exercise.category || '',
        muscleGroup: exercise.muscleGroup || '',
        duration: exercise.duration || 0,
        distance: exercise.distance || 0,
        caloriesBurned: exercise.caloriesBurned || 0,
      })),
    };

    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
