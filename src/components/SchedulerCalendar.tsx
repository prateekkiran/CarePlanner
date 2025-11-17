'use client';

import {
  Calendar,
  CalendarCurrentDate,
  CalendarDayView,
  CalendarMonthView,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
  CalendarViewTrigger,
  CalendarWeekView,
  useCalendar
} from '@/components/ui/full-calendar';
import { CalendarEvent } from '@/components/ui/full-calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface SchedulerCalendarProps {
  events: CalendarEvent[];
  onSelect: (id: string) => void;
  initialView?: 'day' | 'week' | 'month';
}

const calendarViews: Array<'day' | 'week' | 'month'> = ['day', 'week', 'month'];

export function SchedulerCalendar({ events, onSelect, initialView = 'week' }: SchedulerCalendarProps) {
  return (
    <Calendar events={events} view={initialView} onEventClick={(event) => onSelect(event.id)}>
      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-4 text-sm text-slate-600">
          <div className="flex gap-2">
            {calendarViews.map((view) => (
              <CalendarViewTrigger
                key={view}
                view={view}
                className="aria-[current=true]:bg-slate-900 aria-[current=true]:text-white rounded-full px-4 py-2 text-slate-600"
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </CalendarViewTrigger>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3 text-slate-500">
            <CalendarIcon className="h-4 w-4" />
            <CalendarCurrentDate />
            <CalendarPrevTrigger>
              <ChevronLeft className="h-4 w-4" />
            </CalendarPrevTrigger>
            <CalendarTodayTrigger>Today</CalendarTodayTrigger>
            <CalendarNextTrigger>
              <ChevronRight className="h-4 w-4" />
            </CalendarNextTrigger>
          </div>
        </div>
        <div className="relative h-[640px] overflow-hidden px-4 pb-4 pt-4">
          <CalendarViewport />
        </div>
      </div>
    </Calendar>
  );
}

function CalendarViewport() {
  const { view } = useCalendar();

  if (view === 'day') {
    return <CalendarDayView />;
  }

  if (view === 'month') {
    return <CalendarMonthView />;
  }

  return <CalendarWeekView />;
}
