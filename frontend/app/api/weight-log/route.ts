import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { WeightLog } from '@/models/WeightLog';

// GET: Fetch weight log history
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    // Calculate the start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    // Fetch weight logs from the database
    const logs = await WeightLog.find({
      date: { $gte: startDate }
    }).sort({ date: 1 }).lean();
    
    // Fill in missing days with previous day's weight
    const filledLogs = [];
    const logMap = new Map(logs.map(log => [log.date.toISOString().split('T')[0], log]));
    
    let lastWeight = null;
    let lastBodyFat = null;
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - (days - 1 - i));
      currentDate.setHours(0, 0, 0, 0);
      
      const dateKey = currentDate.toISOString().split('T')[0];
      const existingLog = logMap.get(dateKey);
      
      if (existingLog) {
        lastWeight = existingLog.weight;
        lastBodyFat = existingLog.bodyFatPercentage || null;
        filledLogs.push({
          date: currentDate,
          weight: existingLog.weight,
          bodyFatPercentage: existingLog.bodyFatPercentage,
          isActual: true,
        });
      } else if (lastWeight !== null) {
        // Fill with previous day's data
        filledLogs.push({
          date: currentDate,
          weight: lastWeight,
          bodyFatPercentage: lastBodyFat,
          isActual: false,
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: filledLogs,
    });
  } catch (error: any) {
    console.error('Error fetching weight log:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST: Save a weight log entry
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { date, weight, bodyFatPercentage, notes } = body;
    
    if (!weight) {
      return NextResponse.json(
        { success: false, error: 'Weight is required' },
        { status: 400 }
      );
    }
    
    // Parse and normalize the date to start of day
    const logDate = date ? new Date(date) : new Date();
    logDate.setHours(0, 0, 0, 0);
    
    // Upsert: update if exists for this date, create if not
    const weightLog = await WeightLog.findOneAndUpdate(
      { date: logDate },
      {
        weight,
        bodyFatPercentage,
        notes,
      },
      {
        new: true,
        upsert: true,
      }
    );
    
    return NextResponse.json({
      success: true,
      data: weightLog,
    });
  } catch (error: any) {
    console.error('Error saving weight log:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
