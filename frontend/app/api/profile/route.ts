import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserProfile, { calculateTDEE, calculateCalorieTarget } from '@/models/UserProfile';

// GET: Fetch user profile
export async function GET() {
  try {
    await dbConnect();

    // For now, we'll use a single profile (later can be extended for multiple users)
    let profile = await UserProfile.findOne();

    if (!profile) {
      // Create default profile based on your stats
      profile = await UserProfile.create({
        currentWeight: 99.7,
        targetWeight: 86,
        bodyFatPercentage: 26.5,
        skeletalMuscle: 41.8,
        visceralFatIndex: 11,
        bmr: 1951,
        activityLevel: 'moderate',
        goalType: 'cut',
        weeklyWeightChangeGoal: -0.6, // -0.6 kg per week (cutting)
        dailyCalorieTarget: 2300,
        dailyProteinTarget: 190,
        waterGoal: 4,
        exerciseGoal: 60,
      });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// PUT: Update user profile
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    
    // Recalculate targets if relevant fields changed
    if (body.bmr || body.activityLevel || body.weeklyWeightChangeGoal) {
      const bmr = body.bmr || 1951;
      const activityLevel = body.activityLevel || 'moderate';
      const weeklyGoal = body.weeklyWeightChangeGoal || -0.6;
      
      body.dailyCalorieTarget = calculateCalorieTarget(bmr, activityLevel, weeklyGoal);
      
      // Calculate protein target (2g per kg of lean body mass)
      if (body.currentWeight && body.bodyFatPercentage) {
        const leanMass = body.currentWeight * (1 - body.bodyFatPercentage / 100);
        body.dailyProteinTarget = Math.round(leanMass * 2);
      }
    }

    const profile = await UserProfile.findOneAndUpdate(
      {},
      body,
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
