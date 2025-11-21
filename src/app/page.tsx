'use client';

import { useMemo, useState } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { AppShell } from '@/components/AppShell';
import { SchedulerPage } from '@/components/SchedulerPage';
import { ClientsWorkspace } from '@/components/ClientsWorkspace';
import { StaffWorkspace } from '@/components/StaffWorkspace';
import { RoomsWorkspace } from '@/components/RoomsWorkspace';
import { AnalyticsWorkspace } from '@/components/AnalyticsWorkspace';
import { WaitlistPanel } from '@/components/WaitlistPanel';
import { AvailabilityPanel } from '@/components/AvailabilityPanel';
import { schedulerSnapshot } from '@/lib/mockData';

export default function Page() {
  const [activeView, setActiveView] = useState<string>('schedule');
  const [anchor, setAnchor] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [horizonDays, setHorizonDays] = useState(7);

  const dateLabel = useMemo(() => {
    const end = addDays(anchor, Math.max(horizonDays - 1, 0));
    return `${format(anchor, 'MMM d')} – ${format(end, 'MMM d')}`;
  }, [anchor, horizonDays]);

  const summary = [
    { label: 'Appointments this week', value: schedulerSnapshot.appointments.length },
    { label: 'Clients active', value: schedulerSnapshot.clients.length },
    { label: 'Staff scheduled', value: schedulerSnapshot.staff.length },
    { label: 'Waitlist', value: schedulerSnapshot.waitlist.length }
  ];

  return (
    <AppShell
      active={activeView}
      onNavigate={(next) => setActiveView(next)}
      dateLabel={dateLabel}
      onPrevDate={() => setAnchor((prev) => addDays(prev, -horizonDays))}
      onNextDate={() => setAnchor((prev) => addDays(prev, horizonDays))}
      onToday={() => setAnchor(startOfWeek(new Date(), { weekStartsOn: 1 }))}
    >
      <div className={activeView === 'home' ? 'block' : 'hidden'}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</p>
              <p className="text-sm text-slate-500">Live snapshot · context preserved when you return</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <WaitlistPanel entries={schedulerSnapshot.waitlist} />
          <AvailabilityPanel items={schedulerSnapshot.availability} />
        </div>
      </div>

      <div className={activeView === 'schedule' ? 'block' : 'hidden'}>
        <SchedulerPage
          weekAnchor={anchor}
          onWeekAnchorChange={(nextAnchor, nextHorizon) => {
            setAnchor(nextAnchor);
            setHorizonDays(nextHorizon);
          }}
        />
      </div>

      <div className={activeView === 'clients' ? 'block' : 'hidden'}>
        <ClientsWorkspace />
      </div>

      <div className={activeView === 'staff' ? 'block' : 'hidden'}>
        <StaffWorkspace />
      </div>

      <div className={activeView === 'rooms' ? 'block' : 'hidden'}>
        <RoomsWorkspace />
      </div>

      <div className={activeView === 'analytics' ? 'block' : 'hidden'}>
        <AnalyticsWorkspace />
      </div>

      <div className={activeView === 'intake' ? 'block' : 'hidden'}>
        <WaitlistPanel entries={schedulerSnapshot.waitlist} />
      </div>

      {activeView === 'settings' && (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 text-slate-600 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Settings</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">Workspace preferences</p>
          <p className="text-sm text-slate-500">Use the global shell to keep context across scheduler, clients, and analytics.</p>
        </div>
      )}
    </AppShell>
  );
}
