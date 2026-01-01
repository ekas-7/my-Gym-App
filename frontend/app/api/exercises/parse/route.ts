import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// POST - Parse exercise description using Gemini AI
export async function POST(request: NextRequest) {
  try {
    const { exerciseDescription } = await request.json();

    if (!exerciseDescription || typeof exerciseDescription !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Exercise description is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a fitness expert AI. Analyze the following exercise description and extract structured data.

Exercise description: "${exerciseDescription}"

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "name": "Exercise name",
  "category": "cardio" or "weight-training",
  "muscleGroup": "chest" or "back" or "shoulders" or "legs" or "arms" or "core" or "full-body" (only for weight-training),
  "sets": number of sets (for weight-training, default to 3 if not specified),
  "reps": number of reps per set (for weight-training, default to 10 if not specified),
  "weight": weight in kg (for weight-training, default to 0 if not specified),
  "duration": duration in minutes (for cardio or if time-based),
  "distance": distance in km (for running/cycling/etc),
  "caloriesBurned": estimated calories burned (approximate based on exercise type),
  "notes": "any additional details or form notes"
}

Examples:
- "3 sets of 10 reps bench press at 80kg" → {"name": "Bench Press", "category": "weight-training", "muscleGroup": "chest", "sets": 3, "reps": 10, "weight": 80, "caloriesBurned": 100}
- "30 minute run, 5km" → {"name": "Running", "category": "cardio", "duration": 30, "distance": 5, "caloriesBurned": 300}
- "squats 4x12 at 100kg" → {"name": "Squats", "category": "weight-training", "muscleGroup": "legs", "sets": 4, "reps": 12, "weight": 100, "caloriesBurned": 150}
- "20 push-ups" → {"name": "Push-ups", "category": "weight-training", "muscleGroup": "chest", "sets": 1, "reps": 20, "weight": 0, "caloriesBurned": 30}

Be intelligent about:
- Inferring muscle groups from exercise names
- Estimating calories based on exercise intensity and duration
- Understanding common gym notation (e.g., "4x12" means 4 sets of 12 reps)
- Recognizing cardio vs weight training exercises
- Converting units if needed (lbs to kg, miles to km)

Return only the JSON object, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    const exerciseData = JSON.parse(text);

    // Validate required fields
    if (!exerciseData.name || !exerciseData.category) {
      return NextResponse.json(
        { success: false, error: 'AI could not extract exercise information' },
        { status: 400 }
      );
    }

    // Ensure numeric values are numbers
    const parsedData = {
      name: exerciseData.name,
      category: exerciseData.category,
      muscleGroup: exerciseData.muscleGroup || undefined,
      sets: exerciseData.sets ? Number(exerciseData.sets) : undefined,
      reps: exerciseData.reps ? Number(exerciseData.reps) : undefined,
      weight: exerciseData.weight ? Number(exerciseData.weight) : undefined,
      duration: exerciseData.duration ? Number(exerciseData.duration) : undefined,
      distance: exerciseData.distance ? Number(exerciseData.distance) : undefined,
      caloriesBurned: exerciseData.caloriesBurned ? Number(exerciseData.caloriesBurned) : undefined,
      notes: exerciseData.notes || undefined,
    };

    return NextResponse.json({
      success: true,
      data: parsedData,
    });

  } catch (error: any) {
    console.error('Error parsing exercise:', error);
    
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'AI returned invalid format. Please try rephrasing your exercise description.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to analyze exercise' },
      { status: 500 }
    );
  }
}
