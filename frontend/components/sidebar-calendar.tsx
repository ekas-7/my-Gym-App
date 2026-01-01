"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IFitnessLog } from "@/models/FitnessLog";

interface SidebarCalendarProps {
  logs: IFitnessLog[];
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
}

export default function SidebarCalendar({ logs, selectedDate, onSelectDate }: SidebarCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-[320px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  // Get the first day of the month and number of days
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  // Create array of days
  const days: (number | null)[] = [];
  
  // Add empty slots for days before the first of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Helper to get log for a specific day
  const getLogForDay = (day: number) => {
    const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return logs.find(log => {
      const logDate = new Date(log.date);
      return (
        logDate.getDate() === day &&
        logDate.getMonth() === currentMonth.getMonth() &&
        logDate.getFullYear() === currentMonth.getFullYear()
      );
    });
  };

  // Helper to check if a day is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  // Helper to check if a day is selected
  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Calculate completion percentage
  const getCompletionPercentage = (log: IFitnessLog | undefined) => {
    if (!log || log.totalGoals === 0) return 0;
    return Math.round((log.goalsCompleted / log.totalGoals) * 100);
  };

  // Get color based on completion
  const getStreakColor = (completion: number) => {
    if (completion === 100) return 'bg-emerald-500 dark:bg-emerald-400';
    if (completion >= 50) return 'bg-amber-400 dark:bg-amber-500';
    if (completion > 0) return 'bg-slate-400 dark:bg-slate-500';
    return '';
  };

  // Navigate months
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onSelectDate?.(newDate);
  };

  return (
    <div className="w-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={previousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="space-y-2">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const log = getLogForDay(day);
            const completion = getCompletionPercentage(log);
            const streakColor = getStreakColor(completion);
            const today = isToday(day);
            const selected = isSelected(day);

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`
                  aspect-square rounded-md text-sm font-medium
                  transition-all duration-200
                  relative
                  ${today ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
                  ${selected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}
                  ${!selected && !today ? 'text-gray-900 dark:text-gray-100' : ''}
                `}
              >
                <span className="relative z-10">{day}</span>
                
                {/* Streak indicator dot */}
                {streakColor && (
                  <div
                    className={`
                      absolute bottom-0.5 left-1/2 transform -translate-x-1/2
                      w-1 h-1 rounded-full
                      ${streakColor}
                    `}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span>100%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500" />
            <span>50%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
            <span>&lt;50%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
