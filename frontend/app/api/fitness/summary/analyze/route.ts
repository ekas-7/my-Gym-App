import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dbConnect from '@/lib/mongodb';
import FitnessLog from '@/models/FitnessLog';
import Meal from '@/models/Meal';
import Exercise from '@/models/Exercise';

export const dynamic = 'force-dynamic';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'day'; // day, week, month, year

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = new Date(today);
    let periodLabel = '';

    if (period === 'day') {
      periodLabel = 'today';
    } else if (period === 'week') {
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate.setDate(today.getDate() - diff);
      periodLabel = 'this week';
    } else if (period === 'month') {
      startDate.setDate(1);
      periodLabel = 'this month';
    } else if (period === 'year') {
      startDate.setMonth(0, 1);
      periodLabel = 'this year';
    }

    // Fetch fitness logs
    const logs = await FitnessLog.find({
      date: { $gte: startDate },
    }).sort({ date: -1 });

    // Fetch meals for the period
    const meals = await Meal.find({
      date: { $gte: startDate },
    }).sort({ date: -1 });

    // Fetch exercises for the period
    const exercises = await Exercise.find({
      date: { $gte: startDate },
    }).sort({ date: -1 });

    // Calculate summary data
    const summary = {
      period,
      periodLabel,
      totalDays: logs.length,
      water: {
        totalConsumed: 0,
        totalGoal: 0,
        avgDaily: 0,
        daysMetGoal: 0,
      },
      calories: {
        totalConsumed: 0,
        totalGoal: 0,
        avgDaily: 0,
        daysMetGoal: 0,
      },
      exercise: {
        totalMinutes: 0,
        totalGoal: 0,
        avgDaily: 0,
        daysMetGoal: 0,
      },
      macros: {
        totalCarbs: 0,
        totalFats: 0,
        totalProtein: 0,
        avgCarbs: 0,
        avgFats: 0,
        avgProtein: 0,
      },
      streakDays: 0,
      mealBreakdown: {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        snack: 0,
        other: 0,
      },
      exerciseBreakdown: {
        cardio: 0,
        weightTraining: 0,
      },
    };

    // Process fitness logs
    logs.forEach((log) => {
      summary.water.totalConsumed += log.waterLiters || 0;
      summary.water.totalGoal += log.waterGoal || 0;
      if ((log.waterLiters || 0) >= (log.waterGoal || 1)) {
        summary.water.daysMetGoal++;
      }

      summary.calories.totalConsumed += log.calories || 0;
      summary.calories.totalGoal += log.calorieGoal || 0;
      if ((log.calories || 0) >= (log.calorieGoal || 1) * 0.9) { // 90% threshold
        summary.calories.daysMetGoal++;
      }

      summary.exercise.totalMinutes += log.exerciseMinutes || 0;
      summary.exercise.totalGoal += log.exerciseGoal || 0;
      if ((log.exerciseMinutes || 0) >= (log.exerciseGoal || 1)) {
        summary.exercise.daysMetGoal++;
      }

      summary.macros.totalCarbs += log.carbs || 0;
      summary.macros.totalFats += log.fats || 0;
      summary.macros.totalProtein += log.protein || 0;

      if (log.isStreakDay) {
        summary.streakDays++;
      }
    });

    // Calculate averages
    if (logs.length > 0) {
      summary.water.avgDaily = summary.water.totalConsumed / logs.length;
      summary.calories.avgDaily = summary.calories.totalConsumed / logs.length;
      summary.exercise.avgDaily = summary.exercise.totalMinutes / logs.length;
      summary.macros.avgCarbs = summary.macros.totalCarbs / logs.length;
      summary.macros.avgFats = summary.macros.totalFats / logs.length;
      summary.macros.avgProtein = summary.macros.totalProtein / logs.length;
    }

    // Process meals
    meals.forEach((meal) => {
      const type = meal.mealType || 'other';
      if (type in summary.mealBreakdown) {
        summary.mealBreakdown[type as keyof typeof summary.mealBreakdown]++;
      }
    });

    // Process exercises
    exercises.forEach((exercise) => {
      if (exercise.category === 'cardio') {
        summary.exerciseBreakdown.cardio++;
      } else if (exercise.category === 'weight-training') {
        summary.exerciseBreakdown.weightTraining++;
      }
    });

    // Generate AI analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `You are a fitness coach analyzing a user's fitness data for ${periodLabel}. Based on the following data, provide personalized insights, recommendations, and encouragement.

FITNESS DATA FOR ${periodLabel.toUpperCase()}:
- Total Days Tracked: ${summary.totalDays}
- Streak Days (all goals met): ${summary.streakDays}

HYDRATION:
- Total Water Consumed: ${summary.water.totalConsumed.toFixed(1)} L
- Daily Average: ${summary.water.avgDaily.toFixed(2)} L
- Days Met Goal: ${summary.water.daysMetGoal}/${summary.totalDays}

NUTRITION:
- Total Calories: ${summary.calories.totalConsumed.toLocaleString()} kcal
- Daily Average: ${Math.round(summary.calories.avgDaily)} kcal
- Days Met Goal: ${summary.calories.daysMetGoal}/${summary.totalDays}
- Avg Carbs: ${Math.round(summary.macros.avgCarbs)}g
- Avg Fats: ${Math.round(summary.macros.avgFats)}g
- Avg Protein: ${Math.round(summary.macros.avgProtein)}g
- Meals Logged: Breakfast(${summary.mealBreakdown.breakfast}), Lunch(${summary.mealBreakdown.lunch}), Dinner(${summary.mealBreakdown.dinner}), Snacks(${summary.mealBreakdown.snack})

EXERCISE:
- Total Minutes: ${summary.exercise.totalMinutes} min
- Daily Average: ${Math.round(summary.exercise.avgDaily)} min
- Days Met Goal: ${summary.exercise.daysMetGoal}/${summary.totalDays}
- Cardio Sessions: ${summary.exerciseBreakdown.cardio}
- Weight Training Sessions: ${summary.exerciseBreakdown.weightTraining}

Please provide your analysis in the following JSON format ONLY, no additional text:
{
  "overallScore": <number 0-100>,
  "highlights": [<array of 2-3 positive achievements as strings>],
  "areasToImprove": [<array of 2-3 areas needing improvement as strings>],
  "hydrationInsight": "<specific insight about hydration habits>",
  "nutritionInsight": "<specific insight about nutrition and macros>",
  "exerciseInsight": "<specific insight about exercise patterns>",
  "weeklyTip": "<actionable tip for the upcoming period>",
  "motivationalMessage": "<personalized encouraging message>"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse AI response
    let analysis;
    try {
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      // Provide fallback analysis
      analysis = {
        overallScore: Math.round((summary.streakDays / Math.max(summary.totalDays, 1)) * 100),
        highlights: ['You are tracking your fitness data consistently!'],
        areasToImprove: ['Keep logging your meals and exercises for better insights.'],
        hydrationInsight: `You've consumed ${summary.water.totalConsumed.toFixed(1)}L of water ${periodLabel}.`,
        nutritionInsight: `Your average daily calorie intake is ${Math.round(summary.calories.avgDaily)} kcal.`,
        exerciseInsight: `You've exercised for a total of ${summary.exercise.totalMinutes} minutes ${periodLabel}.`,
        weeklyTip: 'Stay consistent with your goals and track daily for best results.',
        motivationalMessage: 'Keep up the great work on your fitness journey!',
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        analysis,
      },
    });
  } catch (error) {
    console.error('Error generating analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}
