import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { summary, period } = body;

    if (!summary) {
      return NextResponse.json(
        { success: false, error: 'Summary data is required' },
        { status: 400 }
      );
    }

    const periodLabel = period === 'day' ? 'today' : period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'this year';

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `You are a fitness coach analyzing a user's fitness data for ${periodLabel}. Based on the following data, provide personalized insights, recommendations, and encouragement.

FITNESS DATA FOR ${periodLabel.toUpperCase()}:
- Days Tracked: ${summary.totalDays}

HYDRATION:
- Total Water Consumed: ${summary.water?.consumed?.toFixed?.(1) ?? 0} L
- Daily Goal: ${summary.water?.goal?.toFixed?.(1) ?? 4} L
- Achievement: ${summary.water?.percentage ?? 0}%

NUTRITION:
- Total Calories: ${summary.calories?.consumed ?? 0} kcal
- Daily Goal: ${summary.calories?.goal ?? 2000} kcal
- Achievement: ${summary.calories?.percentage ?? 0}%

EXERCISE:
- Total Calories Burned: ${summary.exercise?.calories ?? 0} cal
- Daily Goal: ${summary.exercise?.goal ?? 500} cal
- Achievement: ${summary.exercise?.percentage ?? 0}%

Please provide your analysis in the following JSON format ONLY, no additional text:
{
  "overallScore": <number 0-100>,
  "highlights": [<array of 2-3 positive achievements as strings>],
  "areasToImprove": [<array of 2-3 areas needing improvement as strings>],
  "hydrationInsight": "<specific insight about hydration habits>",
  "nutritionInsight": "<specific insight about nutrition>",
  "exerciseInsight": "<specific insight about exercise patterns>",
  "weeklyTip": "<actionable tip for the upcoming period>",
  "motivationalMessage": "<personalized encouraging message>"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let analysis;
    try {
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(jsonText);
    } catch {
      analysis = {
        overallScore: summary.water?.percentage
          ? Math.round((summary.water.percentage + summary.calories.percentage + summary.exercise.percentage) / 3)
          : 50,
        highlights: ['You are tracking your fitness data!'],
        areasToImprove: ['Keep logging your meals and exercises for better insights.'],
        hydrationInsight: `You've consumed ${summary.water?.consumed?.toFixed?.(1) ?? 0}L of water ${periodLabel}.`,
        nutritionInsight: `Your calorie intake is ${summary.calories?.consumed ?? 0} kcal ${periodLabel}.`,
        exerciseInsight: `You've burned ${summary.exercise?.calories ?? 0} exercise calories ${periodLabel}.`,
        weeklyTip: 'Stay consistent with your goals and track daily for best results.',
        motivationalMessage: 'Keep up the great work on your fitness journey!',
      };
    }

    return NextResponse.json({ success: true, data: { analysis } });
  } catch (error) {
    console.error('Error generating analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}
