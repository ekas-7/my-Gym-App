import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FitnessLog, { IFitnessLog } from '@/models/FitnessLog';

// GET: Fetch today's fitness log or create a new one
export async function GET() {
  try {
    await dbConnect();

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let fitnessLog = await FitnessLog.findOne({
      date: { $gte: today, $lt: tomorrow },
    });

    if (!fitnessLog) {
      // Create a new log for today
      fitnessLog = await FitnessLog.create({
        date: today,
        waterLiters: 0,
        waterGoal: 2.5,
        calories: 0,
        calorieGoal: 2000,
        exerciseMinutes: 0,
        exerciseGoal: 60,
      });
    }

    return NextResponse.json({ success: true, data: fitnessLog });
  } catch (error) {
    console.error('Error fetching fitness log:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fitness log' },
      { status: 500 }
    );
  }
}

// POST: Create a new fitness log
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const fitnessLog = await FitnessLog.create(body);

    return NextResponse.json({ success: true, data: fitnessLog }, { status: 201 });
  } catch (error) {
    console.error('Error creating fitness log:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create fitness log' },
      { status: 500 }
    );
  }
}

// PUT: Update today's fitness log
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const fitnessLog = await FitnessLog.findOneAndUpdate(
      { date: { $gte: today, $lt: tomorrow } },
      body,
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: fitnessLog });
  } catch (error) {
    console.error('Error updating fitness log:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update fitness log' },
      { status: 500 }
    );
  }
}
