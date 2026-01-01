import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Exercise, { IExercise } from '@/models/Exercise';

export const dynamic = 'force-dynamic';

// GET - Fetch exercises by date or date range
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const muscleGroup = searchParams.get('muscleGroup');

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

    // Filter by muscle group
    if (muscleGroup) {
      query.muscleGroup = muscleGroup;
    }

    const exercises = await Exercise.find(query).sort({ date: -1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: exercises,
      count: exercises.length,
    });
  } catch (error: any) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
}

// POST - Create a new exercise
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.category || !body.date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, category, date' },
        { status: 400 }
      );
    }

    // Create the exercise
    const exerciseData: Partial<IExercise> = {
      date: new Date(body.date),
      name: body.name,
      category: body.category,
      muscleGroup: body.muscleGroup,
      sets: body.sets || [],
      duration: body.duration,
      distance: body.distance,
      notes: body.notes,
      caloriesBurned: body.caloriesBurned,
    };

    const exercise = await Exercise.create(exerciseData);

    return NextResponse.json({
      success: true,
      data: exercise,
      message: 'Exercise logged successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating exercise:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create exercise' },
      { status: 500 }
    );
  }
}

// PUT - Update an exercise
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json(
        { success: false, error: 'Exercise ID is required' },
        { status: 400 }
      );
    }

    // Update the exercise
    const exercise = await Exercise.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!exercise) {
      return NextResponse.json(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: exercise,
      message: 'Exercise updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating exercise:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update exercise' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an exercise
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Exercise ID is required' },
        { status: 400 }
      );
    }

    const exercise = await Exercise.findByIdAndDelete(id);

    if (!exercise) {
      return NextResponse.json(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Exercise deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting exercise:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete exercise' },
      { status: 500 }
    );
  }
}
