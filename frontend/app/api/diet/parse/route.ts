import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { foodDescription } = await request.json();

    if (!foodDescription || typeof foodDescription !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Food description is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Get the generative model
  // Change this line in your route.ts
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // Create the prompt
    const prompt = `Analyze the following food/meal description and provide nutritional information.
Return ONLY a valid JSON object with the exact format shown below, no additional text or markdown:

{
  "calories": number,
  "carbs": number,
  "fats": number,
  "protein": number
}

All values should be in:
- calories: kcal
- carbs: grams
- fats: grams  
- protein: grams

Food description: "${foodDescription}"

Respond with ONLY the JSON object, nothing else.`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini raw response:', text);

    // Parse the response - try to extract JSON even if wrapped in markdown
    let nutritionData;
    try {
      // Remove markdown code blocks if present
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      nutritionData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to parse nutrition data from AI response',
          rawResponse: text 
        },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (
      typeof nutritionData.calories !== 'number' ||
      typeof nutritionData.carbs !== 'number' ||
      typeof nutritionData.fats !== 'number' ||
      typeof nutritionData.protein !== 'number'
    ) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid nutrition data format from AI',
          data: nutritionData 
        },
        { status: 500 }
      );
    }

    // Round values to 1 decimal place
    const formattedData = {
      calories: Math.round(nutritionData.calories * 10) / 10,
      carbs: Math.round(nutritionData.carbs * 10) / 10,
      fats: Math.round(nutritionData.fats * 10) / 10,
      protein: Math.round(nutritionData.protein * 10) / 10,
    };

    return NextResponse.json({
      success: true,
      data: formattedData,
    });

  } catch (error: any) {
    console.error('Error analyzing food:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to analyze food description' 
      },
      { status: 500 }
    );
  }
}
