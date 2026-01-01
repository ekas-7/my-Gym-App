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

  // Generate calendar data for the last N months
  const generateCalendarDays = () => {
    const days: { date: Date; log: IFitnessLog | null }[] = [];
    const today = new Date();
    const startDate = new Date();
    startDate.setMonth(today.getMonth() - monthsToShow + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Calculate days to show
    const currentDate = new Date(startDate);
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    while (currentDate <= endDate) {
      const dateKey = formatDateKey(currentDate);
      const log = logMap.get(dateKey) || null;
      days.push({ date: new Date(currentDate), log });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  if (!isMounted) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Activity Calendar</h3>
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Activity Calendar</h3>
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-emerald-600"></div>
            <span>100%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-amber-500"></div>
            <span>50-99%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-slate-400 border-2 border-slate-500"></div>
            <span>&lt;50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-slate-100 border-2 border-slate-200"></div>
            <span>None</span>
          </div>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-xs text-gray-500 text-center font-medium">
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
              const completion = day.log ? getCompletionPercentage(day.log) : 0;
              const colors = getStreakColor(completion);

              return (
                <div
                  key={dayIndex}
                  className="relative group aspect-square"
                  title={`${day.date.toLocaleDateString()}: ${completion}% complete`}
                >
                  <div
                    className={`
                      w-full h-full rounded-full
                      ${isFuture 
                        ? 'bg-slate-50 border-2 border-slate-200' 
                        : completion === 100 
                          ? 'bg-emerald-500 border-2 border-emerald-600'
                          : completion >= 50
                            ? 'bg-amber-400 border-2 border-amber-500'
                            : completion > 0
                              ? 'bg-slate-400 border-2 border-slate-500'
                              : 'bg-slate-100 border-2 border-slate-200'
                      }
                      ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                      flex items-center justify-center
                      transition-all duration-200 hover:scale-110
                      cursor-pointer
                    `}
                  >
                    <span
                      className={`
                        text-[10px] font-bold
                        ${isFuture 
                          ? 'text-slate-300' 
                          : completion === 100
                            ? 'text-white'
                            : completion >= 50
                              ? 'text-amber-900'
                              : completion > 0
                                ? 'text-white'
                                : 'text-slate-400'
                        }
                      `}
                    >
                      {!isFuture && completion > 0 ? `${completion}%` : ''}
                    </span>
                  </div>

                  {/* Date number - shown on hover */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                    {day.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                    {day.log && (
                      <div className="text-[10px] mt-1">
                        {day.log.goalsCompleted}/{day.log.totalGoals} goals
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Month markers */}
      <div className="flex justify-between text-xs text-gray-500 mt-4 px-1">
        {Array.from({ length: monthsToShow }).map((_, i) => {
          const monthDate = new Date();
          monthDate.setMonth(today.getMonth() - monthsToShow + 1 + i);
          return (
            <div key={i}>
              {monthDate.toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
