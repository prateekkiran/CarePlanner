'use client';

import { Appointment } from '@/lib/types';
import { addDays, DAY_END, DAY_START, formatRange, HOURS, startOfWeek } from '@/lib/date';
import { useMemo } from 'react';

interface SchedulerBoardProps {
  appointments: Appointment[];
  weekStart: Date;
  selectedId?: string;
  onSelect: (id: string) => void;
  onRequestCreate: (slotStart: Date, slotEnd: Date) => void;
  onWeekChange: (delta: number) => void;
  view: 'Week' | 'Day' | 'Month';
}

const PX_PER_MINUTE = 40 / 60;

export function SchedulerBoard({ appointments, weekStart, selectedId, onSelect, onRequestCreate, onWeekChange, view }: SchedulerBoardProps) {
  const days = useMemo(() => {
    if (view === 'Day') {
      return [weekStart];
    }
    if (view === 'Month') {
      const start = startOfWeek(weekStart);
      return Array.from({ length: 28 }, (_, idx) => addDays(start, idx));
    }
    const start = startOfWeek(weekStart);
    return Array.from({ length: 7 }, (_, idx) => addDays(start, idx));
  }, [weekStart, view]);
  const columns = view === 'Month' ? 4 : days.length;
  const label =
    view === 'Day'
      ? weekStart.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
      : view === 'Month'
        ? weekStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        : `${startOfWeek(weekStart).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} - ${addDays(startOfWeek(weekStart), 6).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`;

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">{view} view</p>
          <h3 className="text-xl font-semibold text-slate-900">{label}</h3>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="rounded-full border border-slate-200 px-3 py-1" onClick={() => onWeekChange(-1)}>
            ◀
          </button>
          <button className="rounded-full border border-slate-200 px-3 py-1" onClick={() => onWeekChange(0)}>
            Today
          </button>
          <button className="rounded-full border border-slate-200 px-3 py-1" onClick={() => onWeekChange(1)}>
            ▶
          </button>
        </div>
      </header>
      <div className="grid grid-cols-[5rem,1fr] gap-2">
        <div className="space-y-3 text-xs text-slate-400">
          {HOURS.map((hour) => (
            <div key={hour} style={{ height: 40 }}>
              {`${hour}:00`}
            </div>
          ))}
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="relative rounded-2xl border border-slate-100 bg-slate-50"
              onClick={(event) => {
                const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                const offset = event.clientY - rect.top;
                const minutesFromStart = Math.max(0, Math.min(offset / PX_PER_MINUTE, (DAY_END - DAY_START) * 60));
                const slotStart = new Date(day);
                slotStart.setHours(DAY_START, 0, 0, 0);
                slotStart.setMinutes(slotStart.getMinutes() + minutesFromStart);
                const slotEnd = new Date(slotStart);
                slotEnd.setMinutes(slotEnd.getMinutes() + 60);
                onRequestCreate(slotStart, slotEnd);
              }}
            >
              <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white/80 px-3 py-2 text-xs uppercase tracking-wide text-slate-400">
                <span>{day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="relative px-2 pb-6 pt-4" style={{ height: (DAY_END - DAY_START + 1) * 40 }}>
                {appointments
                  .filter((appt) => new Date(appt.scheduledStart).toDateString() === day.toDateString())
                  .map((appt) => {
                    const start = new Date(appt.scheduledStart);
                    const end = new Date(appt.scheduledEnd);
                    const minutesFromTop = (start.getHours() - DAY_START) * 60 + start.getMinutes();
                    const duration = Math.max(45, (end.getTime() - start.getTime()) / 60000);
                    return (
                      <button
                        key={appt.id}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelect(appt.id);
                        }}
                        className={`absolute w-[calc(100%-1rem)] rounded-2xl border px-3 py-2 text-left text-sm shadow ${
                          selectedId === appt.id
                            ? 'border-emerald-200 bg-emerald-50'
                            : appt.evvRequired
                              ? 'border-orange-200 bg-orange-50'
                              : 'border-slate-200 bg-white'
                        }`}
                        style={{ top: minutesFromTop * PX_PER_MINUTE, height: duration * PX_PER_MINUTE }}
                      >
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{appt.modality}</p>
                        <p className="font-semibold text-slate-900">{appt.title}</p>
                        <p className="text-xs text-slate-500">{formatRange(appt.scheduledStart, appt.scheduledEnd)}</p>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
