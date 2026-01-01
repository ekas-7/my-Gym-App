'use client';

import React, { useState, useEffect } from 'react';
import { IFitnessLog } from '@/models/FitnessLog';
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateActiveDays,
} from '@/lib/streak-utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StreakStatsProps {
  logs: IFitnessLog[];
}

export default function StreakStats({ logs }: StreakStatsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Loading stats...
      </div>
    );
  }

  const currentStreak = calculateCurrentStreak(logs);
  const longestStreak = calculateLongestStreak(logs);
  const activeDays = calculateActiveDays(logs);

  // Calculate total possible days (from first log to today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalDays = 0;
  if (logs.length > 0) {
    const sortedLogs = [...logs].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    const firstDate = new Date(sortedLogs[0].date);
    firstDate.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(today.getTime() - firstDate.getTime());
    totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  const activePercentage = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Start your streak today!';
    if (streak === 1) return "You've started!";
    if (streak < 7) return 'Keep it going!';
    if (streak < 14) return "You're on fire!";
    if (streak < 30) return 'Unstoppable!';
    if (streak < 90) return 'Elite consistency!';
    return "You're a legend!";
  };

  const getStreakLevel = (streak: number) => {
    if (streak === 0) return 'Inactive';
    if (streak < 3) return 'Beginner';
    if (streak < 7) return 'Building';
    if (streak < 14) return 'Strong';
    if (streak < 30) return 'Elite';
    return 'Legendary';
  };

  return (
    <div className="space-y-4">
      {/* Current Streak - Hero Card */}
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-2 border-orange-200 dark:border-orange-800">
        <div className="text-center">
          <div className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2 uppercase tracking-wide">
            {getStreakLevel(currentStreak)}
          </div>
          <div className="text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2">{currentStreak}</div>
          <div className="text-lg text-gray-700 dark:text-gray-300 font-medium mb-1">Day Streak</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{getStreakMessage(currentStreak)}</div>
          {currentStreak > 0 && (
            <Badge className="mt-3 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700">
              All goals completed {currentStreak} {currentStreak === 1 ? 'day' : 'days'} in a row
            </Badge>
          )}
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Longest Streak */}
        <Card className="p-4 text-center hover:shadow-lg transition-shadow dark:hover:shadow-orange-500/10">
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase">Trophy</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{longestStreak}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Longest Streak</div>
          {longestStreak > currentStreak && longestStreak > 0 && (
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
              Beat it!
            </div>
          )}
        </Card>

        {/* Active Days */}
        <Card className="p-4 text-center hover:shadow-lg transition-shadow dark:hover:shadow-green-500/10">
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase">Calendar</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeDays}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Active Days</div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
            {activePercentage}% of time
          </div>
        </Card>

        {/* Perfect Days */}
        <Card className="p-4 text-center hover:shadow-lg transition-shadow dark:hover:shadow-purple-500/10">
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase">Star</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {logs.filter((l) => l.isStreakDay).length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Perfect Days</div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
            All goals met
          </div>
        </Card>
      </div>

      {/* Motivational Messages */}
      {currentStreak === 0 && activeDays > 0 && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <div className="text-sm font-bold text-yellow-700 dark:text-yellow-400">ALERT</div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">Your streak broke!</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Don't worry! You've been active {activeDays} days. Start a new streak today by
                completing all 4 goals: water, calories, exercise, and weight tracking.
              </div>
            </div>
          </div>
        </Card>
      )}

      {currentStreak >= 7 && currentStreak < 14 && (
        <Card className="p-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <div className="text-sm font-bold text-green-700 dark:text-green-400">MILESTONE</div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">7 Days! Habit forming!</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                You're building a solid habit. Research shows it takes 21 days to form a habit. Keep
                going!
              </div>
            </div>
          </div>
        </Card>
      )}

      {currentStreak >= 21 && currentStreak < 30 && (
        <Card className="p-4 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-3">
            <div className="text-sm font-bold text-purple-700 dark:text-purple-400">MILESTONE</div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">21 Days! Habit Formed!</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                You've officially built a habit! This is now part of your lifestyle. Amazing work!
              </div>
            </div>
          </div>
        </Card>
      )}

      {currentStreak >= 30 && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-3">
            <div className="text-sm font-bold text-purple-700 dark:text-purple-400">ELITE</div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">30+ Days! You're Elite!</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                You've achieved what most people only dream of. This level of consistency is truly
                exceptional. You're an inspiration!
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Goals Breakdown */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
        <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Daily Goals Checklist</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 dark:bg-blue-400"></div>
            <span className="text-gray-700 dark:text-gray-300">Drink 4L water</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 dark:bg-green-400"></div>
            <span className="text-gray-700 dark:text-gray-300">Hit calorie target (±10%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500 dark:bg-orange-400"></div>
            <span className="text-gray-700 dark:text-gray-300">60+ minutes exercise</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500 dark:bg-purple-400"></div>
            <span className="text-gray-700 dark:text-gray-300">Log your weight</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
            Complete all 4 goals to maintain your streak!
          </div>
        </div>
      </Card>
    </div>
  );
}
