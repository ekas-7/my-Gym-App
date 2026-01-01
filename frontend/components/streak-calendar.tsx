'use client';

import React, { useState, useEffect } from 'react';
import { IFitnessLog } from '@/models/FitnessLog';
import { formatDateKey, getCompletionPercentage, getStreakColor } from '@/lib/streak-utils';

interface StreakCalendarProps {
  logs: IFitnessLog[];
  monthsToShow?: number; // Default: 3 months
}

export default function StreakCalendar({ logs, monthsToShow = 3 }: StreakCalendarProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Create a map of date -> log for quick lookup
  const logMap = new Map<string, IFitnessLog>();
  logs.forEach((log) => {
    const key = formatDateKey(new Date(log.date));
    logMap.set(key, log);
  });

  // Generate calendar data for the current month with proper week grid
  const generateCalendarDays = () => {
    const days: { date: Date; log: IFitnessLog | null }[] = [];
    const today = new Date();
    
    // Get first and last day of current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Add empty days before the first of the month to align with week start (Sunday)
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    for (let i = 0; i < startDayOfWeek; i++) {
      const emptyDate = new Date(firstDayOfMonth);
      emptyDate.setDate(firstDayOfMonth.getDate() - (startDayOfWeek - i));
      days.push({ date: emptyDate, log: null });
    }
    
    // Add all days of the current month
    const currentDate = new Date(firstDayOfMonth);
    while (currentDate <= lastDayOfMonth) {
      const dateKey = formatDateKey(currentDate);
      const log = logMap.get(dateKey) || null;
      days.push({ date: new Date(currentDate), log });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add empty days after the last of the month to complete the week
    const endDayOfWeek = lastDayOfMonth.getDay(); // 0 = Sunday
    if (endDayOfWeek < 6) {
      for (let i = 1; i <= (6 - endDayOfWeek); i++) {
        const emptyDate = new Date(lastDayOfMonth);
        emptyDate.setDate(lastDayOfMonth.getDate() + i);
        days.push({ date: emptyDate, log: null });
      }
    }

    return days;
  };

  if (!isMounted) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activity Calendar</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground text-sm">
          Loading calendar...
        </div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();

  // Group days by week
  const weeks: typeof calendarDays[] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get current month name
  const currentMonthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{currentMonthName}</h3>
        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400 border-2 border-emerald-600 dark:border-emerald-500"></div>
            <span>100%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-400 dark:bg-amber-500 border-2 border-amber-500 dark:border-amber-600"></div>
            <span>50-99%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-500 border-2 border-slate-500 dark:border-slate-600"></div>
            <span>&lt;50%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700"></div>
            <span>None</span>
          </div>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Calendar grid */}
      <div className="space-y-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-2">
            {week.map((day, dayIndex) => {
              const isToday = day.date.getTime() === today.getTime();
              const isFuture = day.date > today;
              const isCurrentMonth = day.date.getMonth() === today.getMonth();
              const completion = day.log ? getCompletionPercentage(day.log) : 0;

              return (
                <div
                  key={dayIndex}
                  className="relative group aspect-square"
                  title={`${day.date.toLocaleDateString()}: ${completion}% complete`}
                >
                  <div
                    className={`
                      w-full h-full rounded-md
                      flex flex-col items-center justify-center
                      transition-all duration-200
                      ${isCurrentMonth ? '' : 'opacity-30'}
                      ${isToday ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-slate-950' : ''}
                      ${isFuture 
                        ? 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700' 
                        : completion === 100 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 dark:border-emerald-400'
                          : completion >= 50
                            ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-500'
                            : completion > 0
                              ? 'bg-slate-200 dark:bg-slate-700/30 border-2 border-slate-400 dark:border-slate-500'
                              : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
                      }
                      hover:scale-105 cursor-pointer
                    `}
                  >
                    <span
                      className={`
                        text-sm font-semibold
                        ${isFuture || !isCurrentMonth
                          ? 'text-slate-400 dark:text-slate-600' 
                          : completion === 100
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : completion >= 50
                              ? 'text-amber-700 dark:text-amber-300'
                              : completion > 0
                                ? 'text-slate-700 dark:text-slate-300'
                                : 'text-slate-500 dark:text-slate-500'
                        }
                      `}
                    >
                      {day.date.getDate()}
                    </span>
                    
                    {/* Streak indicator dot */}
                    {isCurrentMonth && !isFuture && completion > 0 && (
                      <div
                        className={`
                          w-1.5 h-1.5 rounded-full mt-0.5
                          ${completion === 100 
                            ? 'bg-emerald-500 dark:bg-emerald-400'
                            : completion >= 50
                              ? 'bg-amber-400 dark:bg-amber-500'
                              : 'bg-slate-400 dark:bg-slate-500'
                          }
                        `}
                      />
                    )}
                  </div>

                  {/* Hover tooltip */}
                  {isCurrentMonth && (
                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-slate-100 text-white dark:text-gray-900 text-xs px-3 py-2 rounded whitespace-nowrap pointer-events-none z-10 shadow-lg">
                      <div className="font-semibold">
                        {day.date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      {day.log ? (
                        <div className="text-[10px] mt-1">
                          {day.log.goalsCompleted}/{day.log.totalGoals} goals • {completion}%
                        </div>
                      ) : (
                        <div className="text-[10px] mt-1">
                          No activity
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
