import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Meal, { IMeal } from '@/models/Meal';

export const dynamic = 'force-dynamic';

// GET - Fetch meals by date or date range
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const mealType = searchParams.get('mealType');
    const getTotals = searchParams.get('getTotals') === 'true';

    let query: any = {};

    // Single date query
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    // Date range query
    else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.date = { $gte: start, $lte: end };
    }

    // Filter by meal type
    if (mealType) {
      query.mealType = mealType;
    }

    const meals = await Meal.find(query).sort({ timestamp: -1 });

    // Calculate totals if requested
    let totals = null;
    if (getTotals && meals.length > 0) {
      totals = {
        totalCalories: meals.reduce((sum: number, meal: any) => sum + meal.calories, 0),
        totalCarbs: meals.reduce((sum: number, meal: any) => sum + meal.carbs, 0),
        totalFats: meals.reduce((sum: number, meal: any) => sum + meal.fats, 0),
        totalProtein: meals.reduce((sum: number, meal: any) => sum + meal.protein, 0),
        mealCount: meals.length,
      };
    }

    return NextResponse.json({
      success: true,
      data: meals,
      totals,
      count: meals.length,
    });
  } catch (error: any) {
    console.error('Error fetching meals:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch meals' },
      { status: 500 }
    );
  }
}

// POST - Create a new meal
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    
    // Validate required fields
    if (!body.description || !body.date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: description, date' },
        { status: 400 }
      );
    }

    // Create the meal
    const mealData: Partial<IMeal> = {
      date: new Date(body.date),
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      description: body.description,
      mealType: body.mealType || 'other',
      calories: body.calories || 0,
      carbs: body.carbs || 0,
      fats: body.fats || 0,
      protein: body.protein || 0,
      fiber: body.fiber,
      sugar: body.sugar,
      sodium: body.sodium,
      notes: body.notes,
      isAIAnalyzed: body.isAIAnalyzed || false,
    };

    const meal = await Meal.create(mealData);

    return NextResponse.json({
      success: true,
      data: meal,
      message: 'Meal logged successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating meal:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create meal' },
      { status: 500 }
    );
  }
}

// PUT - Update a meal
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json(
        { success: false, error: 'Meal ID is required' },
        { status: 400 }
      );
    }

    // Update the meal
    const meal = await Meal.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!meal) {
      return NextResponse.json(
        { success: false, error: 'Meal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: meal,
      message: 'Meal updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating meal:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update meal' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a meal
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Meal ID is required' },
        { status: 400 }
      );
    }

    const meal = await Meal.findByIdAndDelete(id);

    if (!meal) {
      return NextResponse.json(
        { success: false, error: 'Meal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meal deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting meal:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete meal' },
      { status: 500 }
    );
  }
}
