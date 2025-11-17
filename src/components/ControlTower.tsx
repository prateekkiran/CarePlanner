'use client';

import { useMemo, useState } from 'react';
import { schedulerSnapshot } from '@/lib/mockData';
import { Sidebar } from './Sidebar';
import { PersonaSwitcher } from './PersonaSwitcher';
import { CommandBar } from './CommandBar';

import { WaitlistPanel } from './WaitlistPanel';
import { AvailabilityPanel } from './AvailabilityPanel';
import { ActionCenter } from './ActionCenter';
import { AppointmentDetailPanel } from './AppointmentDetailPanel';
import { ScheduleComposer } from './ScheduleComposer';
import { addDays, startOfWeek } from '@/lib/date';
import { ExceptionQueue } from './ExceptionQueue';
import { ClientsWorkspace } from './ClientsWorkspace';
import { StaffWorkspace } from './StaffWorkspace';
import { RoomsWorkspace } from './RoomsWorkspace';
import { AnalyticsWorkspace } from './AnalyticsWorkspace';
import { SchedulerWorkspace } from './SchedulerWorkspace';
import { SchedulerBoard } from './SchedulerBoard';

export function ControlTower() {
  const data = schedulerSnapshot;
  const pendingValidations = data.appointments.filter((appointment) =>
    appointment.validations.some((validation) => validation.status !== 'pass')
  ).length;
  const waitlistSize = data.waitlist.length;
  const evvExceptions = data.appointments.filter((appointment) =>
    appointment.validations.some((validation) => validation.id === 'evv' && validation.status !== 'pass')
  ).length;
  const highlightCards = [
    {
      title: 'Scheduler',
      metric: `${data.appointments.length} appts`,
      detail: `${pendingValidations} awaiting validation`,
      target: 'Scheduler',
      accent: 'from-sky-400 to-emerald-400'
    },
    {
      title: 'Clients',
      metric: `${data.clients.length} active`,
      detail: `${waitlistSize} caregivers on waitlist`,
      target: 'Clients',
      accent: 'from-pink-400 to-orange-300'
    },
    {
      title: 'Staff',
      metric: `${data.staff.length} clinicians`,
      detail: `${evvExceptions} EVV exceptions to triage`,
      target: 'Staff',
      accent: 'from-purple-400 to-blue-400'
    },
    {
      title: 'Rooms & resources',
      metric: `${data.rooms.length} resources`,
      detail: `${data.rooms.filter((room) => room.bookedHours > room.availableHours * 0.8).length} near capacity`,
      target: 'Rooms & resources',
      accent: 'from-teal-400 to-cyan-400'
    },
    {
      title: 'Analytics',
      metric: 'Utilization dashboard',
      detail: 'Review KPIs & caregiver sentiment',
      target: 'Analytics',
      accent: 'from-yellow-300 to-orange-300'
    }
  ];
  const [persona, setPersona] = useState(data.personas[0].id);
  const [location, setLocation] = useState('All campuses');
  const [modality, setModality] = useState<'Center' | 'Home' | 'School' | 'Telehealth'>('Center');
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>(data.appointments[0]?.id);
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Control tower');

  const filteredAppointments = useMemo(() => {
    return data.appointments.filter((appointment) => {
      const locationMatch = location === 'All campuses' || appointment.location.includes(location.split(' - ')[0] ?? location);
      const modalityMatch = modality === appointment.modality;
      return locationMatch && modalityMatch;
    });
  }, [location, modality, data.appointments]);

  const selectedAppointment = filteredAppointments.find((appointment) => appointment.id === selectedAppointmentId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7faff] via-[#fff6fb] to-[#eefcff]">
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-10 text-slate-700 lg:px-10">
        <Sidebar active={activeNav} onSelect={setActiveNav} />
        <div className="flex-1 space-y-6">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Control tower</p>
            <h1 className="text-4xl font-semibold text-slate-900">Unified scheduling workspace</h1>
            <p className="text-sm text-slate-500">
              Balance utilization, compliance, caregiver experience, and staff wellbeing with persona-driven insights.
            </p>
          </header>
          {activeNav === 'Control tower' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {highlightCards.map((card) => (
                <article key={card.title} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{card.title}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{card.metric}</p>
                  <p className="text-sm text-slate-500">{card.detail}</p>
                  <button
                    type="button"
                    onClick={() => setActiveNav(card.target)}
                    className={`mt-4 inline-flex items-center rounded-full bg-gradient-to-r ${card.accent} px-4 py-2 text-sm font-semibold text-white`}
                  >
                    Go to {card.title}
                  </button>
                </article>
              ))}
            </div>
          ) : activeNav === 'Scheduler' ? (
            <SchedulerWorkspace />
          ) : activeNav === 'Clients' ? (
            <ClientsWorkspace />
          ) : activeNav === 'Staff' ? (
            <StaffWorkspace />
          ) : activeNav === 'Rooms & resources' ? (
            <RoomsWorkspace />
          ) : activeNav === 'Analytics' ? (
            <AnalyticsWorkspace />
          ) : (
            <>
              <PersonaSwitcher personas={data.personas} activeId={persona} onSelect={setPersona} />
              <CommandBar location={location} onLocationChange={setLocation} modality={modality} onModalityChange={setModality} />
              <div className="workspace-grid">
                <div className="workspace-primary">
                  <SchedulerBoard
                    appointments={filteredAppointments}
                    weekStart={weekStart}
                    selectedId={selectedAppointmentId}
                    onSelect={setSelectedAppointmentId}
                    onWeekChange={(delta: number) => {
                      if (delta === 0) {
                        setWeekStart(startOfWeek(new Date()));
                      } else {
                        setWeekStart((prev) => startOfWeek(addDays(prev, delta * 7)));
                      }
                    }}
                    onRequestCreate={(slotStart: Date, slotEnd: Date) => {
                      void slotStart;
                      void slotEnd;
                      setComposerOpen(true);
                    }}
                  />
                  <ExceptionQueue appointments={filteredAppointments} />
                  <AppointmentDetailPanel
                    appointment={selectedAppointment}
                    authorizations={data.authorizations}
                    onReschedule={() => setComposerOpen(true)}
                  />
                </div>
                <div className="workspace-secondary">
                  <WaitlistPanel entries={data.waitlist} />
                  <AvailabilityPanel items={data.availability} />
                  <ActionCenter notifications={data.notifications} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {composerOpen && <ScheduleComposer onClose={() => setComposerOpen(false)} />}
    </div>
  );
}
