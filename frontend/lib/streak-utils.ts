import { IFitnessLog } from '@/models/FitnessLog';

/**
 * Calculate how many goals were completed for a given day
 * Goals: Water (>=goal), Calories (>=goal), Exercise (>=goal)
 */
export function calculateGoalsCompleted(log: IFitnessLog): {
  goalsCompleted: number;
  totalGoals: number;
  isStreakDay: boolean;
} {
  let completed = 0;
  const total = 3; // water, calories, exercise

  // Goal 1: Water intake met
  if (log.waterLiters >= log.waterGoal) {
    completed++;
  }

  // Goal 2: Calorie target met (within 10% tolerance)
  const calorieTolerance = log.calorieGoal * 0.1;
  if (
    log.calories >= log.calorieGoal - calorieTolerance &&
    log.calories <= log.calorieGoal + calorieTolerance
  ) {
    completed++;
  }

  // Goal 3: Exercise minutes met
  if (log.exerciseMinutes >= log.exerciseGoal) {
    completed++;
  }

  // Streak day = all goals completed
  const isStreakDay = completed === total;

  return {
    goalsCompleted: completed,
    totalGoals: total,
    isStreakDay,
  };
}

/**
 * Calculate current streak from an array of fitness logs (sorted by date descending)
 * A streak is maintained by completing all goals each day
 */
export function calculateCurrentStreak(logs: IFitnessLog[]): number {
  if (!logs || logs.length === 0) return 0;

  // Sort logs by date descending (most recent first)
  const sortedLogs = [...logs].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedLogs.length; i++) {
    const log = sortedLogs[i];
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);

    // Expected date for this position in the streak
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    // Check if log is for the expected date and is a streak day
    const isSameDate = logDate.getTime() === expectedDate.getTime();
    
    if (isSameDate && log.isStreakDay) {
      streak++;
    } else if (!isSameDate || i > 0) {
      // Break streak if:
      // 1. Date doesn't match expected sequence
      // 2. Not a streak day (after the first day)
      break;
    }
  }

  return streak;
}

/**
 * Calculate the longest streak from all fitness logs
 */
export function calculateLongestStreak(logs: IFitnessLog[]): number {
  if (!logs || logs.length === 0) return 0;

  // Sort logs by date ascending
  const sortedLogs = [...logs].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });

  let maxStreak = 0;
  let currentStreak = 0;
  let previousDate: Date | null = null;

  for (const log of sortedLogs) {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);

    if (!log.isStreakDay) {
      // Reset streak if goals not met
      currentStreak = 0;
      previousDate = null;
      continue;
    }

    if (previousDate === null) {
      // Start of a new streak
      currentStreak = 1;
    } else {
      const expectedDate = new Date(previousDate);
      expectedDate.setDate(previousDate.getDate() + 1);

      if (logDate.getTime() === expectedDate.getTime()) {
        // Consecutive day
        currentStreak++;
      } else {
        // Gap in streak, start new one
        currentStreak = 1;
      }
    }

    maxStreak = Math.max(maxStreak, currentStreak);
    previousDate = logDate;
  }

  return maxStreak;
}

/**
 * Get total number of active days (days with any activity)
 */
export function calculateActiveDays(logs: IFitnessLog[]): number {
  if (!logs || logs.length === 0) return 0;
  
  // Count days with at least one goal completed
  return logs.filter(log => log.goalsCompleted > 0).length;
}

/**
 * Get completion percentage for a specific day
 */
export function getCompletionPercentage(log: IFitnessLog): number {
  if (!log.totalGoals || log.totalGoals === 0) return 0;
  return Math.round((log.goalsCompleted / log.totalGoals) * 100);
}

/**
 * Get color for a day based on completion
 * Returns Tailwind CSS color classes
 */
export function getStreakColor(completionPercentage: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (completionPercentage === 100) {
    return {
      bg: 'bg-green-500',
      text: 'text-white',
      border: 'border-green-600',
    };
  } else if (completionPercentage >= 75) {
    return {
      bg: 'bg-green-400',
      text: 'text-white',
      border: 'border-green-500',
    };
  } else if (completionPercentage >= 50) {
    return {
      bg: 'bg-yellow-400',
      text: 'text-gray-900',
      border: 'border-yellow-500',
    };
  } else if (completionPercentage >= 25) {
    return {
      bg: 'bg-orange-400',
      text: 'text-white',
      border: 'border-orange-500',
    };
  } else if (completionPercentage > 0) {
    return {
      bg: 'bg-gray-400',
      text: 'text-white',
      border: 'border-gray-500',
    };
  } else {
    return {
      bg: 'bg-gray-200',
      text: 'text-gray-500',
      border: 'border-gray-300',
    };
  }
}

/**
 * Format date to YYYY-MM-DD for comparison
 */
export function formatDateKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}
