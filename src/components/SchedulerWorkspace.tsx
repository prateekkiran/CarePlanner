'use client';

import { useMemo, useState } from 'react';
import { addMinutes, differenceInMinutes, format, startOfWeek } from 'date-fns';

import { schedulerSnapshot } from '@/lib/mockData';
import { ScheduleComposer } from './ScheduleComposer';
import { AppointmentDetailPanel } from './AppointmentDetailPanel';
import { SchedulerCalendar } from './SchedulerCalendar';
import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 12 }, (_, index) => 7 + index); // 7a–7p
const CARE_SETTINGS: Array<'Center' | 'Home' | 'School' | 'Telehealth'> = ['Center', 'Home', 'School', 'Telehealth'];
const FLAG_CHIPS = ['Show EVV required', 'Auth at risk', 'Waitlist ready', 'Show my staff'];

type TimelineSession = {
  id: string;
  title: string;
  serviceCode: string;
  start: Date;
  end: Date;
  staffId?: string;
  clientName: string;
  modality: 'Center' | 'Home' | 'School' | 'Telehealth';
};

type DraftSlot = {
  laneId: string;
  start: Date;
  end: Date;
};

export function SchedulerWorkspace() {
  const data = schedulerSnapshot;
  const staffLanes = data.availability;
  const clients = data.clients;
  const [scope, setScope] = useState<'Scheduler view' | 'My schedule' | 'Client schedule'>('Scheduler view');
  const [viewScale, setViewScale] = useState<'Day' | '3-day' | 'Week'>('Week');
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [location, setLocation] = useState('All campuses');
  const [careSetting, setCareSetting] = useState<(typeof CARE_SETTINGS)[number] | 'All'>('All');
  const [flags, setFlags] = useState<string[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(() => staffLanes.map((lane) => lane.staffId));
  const [staffSearch, setStaffSearch] = useState('');
  const [sessions, setSessions] = useState<TimelineSession[]>(() =>
    data.appointments.map((appointment) => {
      const start = new Date(appointment.scheduledStart);
      const staffParticipant = appointment.participants.find((participant) => participant.type === 'Staff');
      return {
        id: appointment.id,
        title: appointment.title,
        serviceCode: appointment.serviceCode,
        start,
        end: new Date(appointment.scheduledEnd),
        staffId: staffParticipant?.id,
        clientName: appointment.participants.find((participant) => participant.type === 'Client')?.name ?? '',
        modality: appointment.modality
      };
    })
  );

  const [selectedCalendarSessionId, setSelectedCalendarSessionId] = useState<string | null>(null);
  const [selectedTimelineSessionId, setSelectedTimelineSessionId] = useState<string | null>(null);
  const [draftSlot, setDraftSlot] = useState<DraftSlot | null>(null);
  const [panelMode, setPanelMode] = useState<'detail' | 'quick-create' | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const filteredAppointments = useMemo(() => {
    return data.appointments.filter((appointment) => {
      const locationMatch = location === 'All campuses' || appointment.location.includes(location.split(' - ')[0] ?? location);
      const careSettingMatch = careSetting === 'All' ? true : appointment.modality === careSetting;
      return locationMatch && careSettingMatch;
    });
  }, [data.appointments, location, careSetting]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const locationMatch = location === 'All campuses' ? true : session.title.includes(location.split(' - ')[0] ?? location);
      const careSettingMatch = careSetting === 'All' ? true : session.modality === careSetting;
      return locationMatch && careSettingMatch;
    });
  }, [sessions, location, careSetting]);

  const visibleStaff = useMemo(() => {
    const normalized = staffSearch.toLowerCase();
    return staffLanes.filter((lane) => {
      const matchesSearch = lane.staffName.toLowerCase().includes(normalized);
      return matchesSearch;
    });
  }, [staffLanes, staffSearch]);

  const selectedSession =
    selectedTimelineSessionId != null
      ? sessions.find((session) => session.id === selectedTimelineSessionId)
      : selectedCalendarSessionId != null
        ? sessions.find((session) => session.id === selectedCalendarSessionId)
        : undefined;

  const selectedAppointment = selectedSession
    ? {
        id: selectedSession.id,
        title: selectedSession.title,
        location: selectedSession.modality,
        modality: selectedSession.modality,
        serviceCode: selectedSession.serviceCode,
        status: 'Scheduled',
        scheduledStart: selectedSession.start.toISOString(),
        scheduledEnd: selectedSession.end.toISOString(),
        evvRequired: selectedSession.modality === 'Home',
        participants: [],
        validations: []
      }
    : undefined;

  function handleWeekChange(delta: number) {
    setCurrentWeekStart(startOfWeek(addMinutes(currentWeekStart, delta * 7 * 24 * 60)));
  }

  function handleLaneClick(laneId: string, event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const totalWidth = rect.width;
    const hoursFromStart = (relativeX / totalWidth) * HOURS.length;
    const startHour = Math.max(HOURS[0], Math.min(HOURS[HOURS.length - 1], Math.floor(hoursFromStart) + HOURS[0]));
    const startMinutes = Math.round((hoursFromStart - Math.floor(hoursFromStart)) * 60);
    const slotStart = new Date(currentWeekStart);
    slotStart.setHours(startHour, startMinutes, 0, 0);
    const slotEnd = addMinutes(slotStart, 60);
    setDraftSlot({ laneId, start: slotStart, end: slotEnd });
    setPanelMode('quick-create');
    setSelectedTimelineSessionId(null);
    setSelectedCalendarSessionId(null);
  }

  function handleSessionSelect(sessionId: string) {
    setSelectedTimelineSessionId(sessionId);
    setSelectedCalendarSessionId(null);
    setPanelMode('detail');
  }

  function handleCalendarSelect(sessionId: string) {
    setSelectedCalendarSessionId(sessionId);
    setSelectedTimelineSessionId(null);
    setPanelMode('detail');
  }

  function handleQuickCreate(payload: { clientName: string; title: string; serviceCode: string; location: 'Center' | 'Home' | 'School' | 'Telehealth' }) {
    if (!draftSlot) return;
    const id = `TMP-${Date.now()}`;
    setSessions((prev) => [
      ...prev,
      {
        id,
        title: payload.title,
        serviceCode: payload.serviceCode,
        start: draftSlot.start,
        end: draftSlot.end,
        staffId: draftSlot.laneId,
        clientName: payload.clientName,
        modality: payload.location
      }
    ]);
    setDraftSlot(null);
    setPanelMode('detail');
    setSelectedTimelineSessionId(id);
  }

  return (
    <section className="space-y-6">
      <header className="rounded-4xl bg-gradient-to-br from-emerald-50 via-sky-50 to-indigo-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Schedule</p>
            <h2 className="text-3xl font-semibold text-slate-900">Command center</h2>
            <p className="text-sm text-slate-500">Multi-staff timeline, smart filters, and in-context creation.</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <div className="rounded-full bg-white/70 p-1">
              {(['Scheduler view', 'My schedule', 'Client schedule'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setScope(mode)}
                  className={cn('rounded-full px-3 py-1 font-semibold', scope === mode ? 'bg-slate-900 text-white' : 'text-slate-600')}
                >
                  {mode}
                </button>
              ))}
            </div>
            <div className="rounded-full bg-white/70 p-1">
              {(['Day', '3-day', 'Week'] as const).map((scale) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => setViewScale(scale)}
                  className={cn('rounded-full px-3 py-1 font-semibold', viewScale === scale ? 'bg-emerald-500 text-white' : 'text-slate-600')}
                >
                  {scale}
                </button>
              ))}
            </div>
            <button type="button" className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow" onClick={() => setComposerOpen(true)}>
              + New session
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => handleWeekChange(-1)} className="rounded-full border border-slate-200 px-3 py-1">
              ‹
            </button>
            <span className="uppercase tracking-[0.2em] text-slate-400">Week of {format(currentWeekStart, 'MMM d')}</span>
            <button type="button" onClick={() => handleWeekChange(1)} className="rounded-full border border-slate-200 px-3 py-1">
              ›
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={calendarView}
              onChange={(event) => setCalendarView(event.target.value as 'day' | 'week' | 'month')}
              className="rounded-full border border-slate-200 px-4 py-1 text-slate-600"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
            <button className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">Today</button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <select value={location} onChange={(event) => setLocation(event.target.value)} className="rounded-full border border-slate-200 px-4 py-2 text-sm">
            <option>All campuses</option>
            <option>Austin - North Center</option>
            <option>Telehealth · CST</option>
          </select>
          <div className="flex flex-wrap gap-2">
            {CARE_SETTINGS.map((setting) => (
              <button
                key={setting}
                type="button"
                onClick={() => setCareSetting(setting === careSetting ? 'All' : setting)}
                className={cn('rounded-full border px-3 py-1', careSetting === setting ? 'bg-slate-900 text-white' : 'border-slate-200 text-slate-600')}
              >
                {setting}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {FLAG_CHIPS.map((flag) => (
              <button
                key={flag}
                type="button"
                onClick={() => setFlags((prev) => (prev.includes(flag) ? prev.filter((item) => item !== flag) : [...prev, flag]))}
                className={cn('rounded-full border px-3 py-1', flags.includes(flag) ? 'bg-emerald-500 text-white' : 'border-slate-200 text-slate-600')}
              >
                {flag}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
          <SchedulerCalendar
            events={filteredAppointments.map((appointment) => ({
              id: appointment.id,
              start: new Date(appointment.scheduledStart),
              end: new Date(appointment.scheduledEnd),
              title: appointment.title,
              color: appointment.evvRequired ? 'purple' : 'blue'
            }))}
            onSelect={handleCalendarSelect}
            initialView={calendarView}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px,1fr,320px]">
        <aside className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 text-sm text-slate-600 shadow-sm">
          <section>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Search</p>
            <input placeholder="Find client, staff, or session" className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
          </section>
          <section>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scope filters</p>
            <input
              placeholder="Search staff"
              value={staffSearch}
              onChange={(event) => setStaffSearch(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs"
            />
            <div className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-slate-600">
              {visibleStaff.map((lane) => (
                <label key={lane.staffId} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedStaffIds.includes(lane.staffId)}
                    onChange={(event) =>
                      setSelectedStaffIds((prev) =>
                        event.target.checked ? [...prev, lane.staffId] : prev.filter((id) => id !== lane.staffId)
                      )
                    }
                  />
                  <span>{lane.staffName}</span>
                </label>
              ))}
            </div>
          </section>
          <section>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Saved views</p>
            <div className="mt-2 space-y-2">
              {['Default scheduler view', 'Center A – RBTs only', 'Telehealth Wednesday'].map((view) => (
                <button key={view} className="w-full rounded-2xl border border-slate-100 px-3 py-2 text-left text-xs text-slate-500">
                  {view}
                </button>
              ))}
            </div>
          </section>
          <section>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Highlights</p>
            <div className="mt-2 space-y-2">
              {['3 clients under plan hours this week', '2 staff under 60% utilization today', '4 sessions with auth at risk'].map((highlight) => (
                <button key={highlight} className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-left text-xs text-slate-600">
                  {highlight} · View
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-[140px,1fr] text-xs uppercase tracking-[0.2em] text-slate-400">
            <div>Staff</div>
            <div className="grid grid-cols-12 gap-2">
              {HOURS.map((hour) => (
                <div key={hour}>{hour}:00</div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {staffLanes
              .filter((lane) => selectedStaffIds.includes(lane.staffId))
              .map((lane) => (
                <div key={lane.staffId} className="rounded-3xl border border-slate-100 bg-slate-50 p-3">
                  <header className="flex items-center justify-between text-xs text-slate-500">
                    <div>
                    <p className="text-sm font-semibold text-slate-900">{lane.staffName}</p>
                    <p>{lane.credential}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-white px-2 py-1">{lane.load}/{lane.target} hrs</span>
                    <span className="rounded-full bg-white px-2 py-1">{lane.location}</span>
                  </div>
                </header>
                <div className="relative mt-3 grid grid-cols-[140px,1fr]">
                  <div></div>
                  <div className="relative min-h-[110px] rounded-2xl bg-white shadow-inner" onClick={(event) => handleLaneClick(lane.staffId, event)}>
                    <div className="absolute inset-0 grid grid-cols-12">
                      {HOURS.map((hour) => (
                        <div key={hour} className="border-l border-dashed border-slate-100"></div>
                      ))}
                    </div>
                    {filteredSessions
                      .filter((session) => session.staffId === lane.staffId)
                      .map((session) => (
                        <SessionCard key={session.id} session={session} onSelect={handleSessionSelect} />
                      ))}
                    {draftSlot && draftSlot.laneId === lane.staffId && <DraftSessionCard slot={draftSlot} />}
                  </div>
                </div>
                </div>
              ))}
          </div>
        </main>

        <aside className="space-y-4">
          {panelMode === 'quick-create' && draftSlot && (
            <QuickCreatePanel slot={draftSlot} clients={clients} onCreate={handleQuickCreate} onCancel={() => setPanelMode(null)} />
          )}
          {panelMode === 'detail' && selectedAppointment && (
            <AppointmentDetailPanel appointment={selectedAppointment} authorizations={data.authorizations} onReschedule={() => setComposerOpen(true)} />
          )}
          {!panelMode && (
            <div className="rounded-3xl border border-slate-100 bg-white p-5 text-sm text-slate-500 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Context</p>
              <p className="mt-2">Select a session or drag to create. Drawer will show validations, auth, EVV, and actions.</p>
            </div>
          )}
        </aside>
      </div>

      {composerOpen && <ScheduleComposer onClose={() => setComposerOpen(false)} />}
    </section>
  );
}

function SessionCard({ session, onSelect }: { session: TimelineSession; onSelect: (id: string) => void }) {
  const totalHours = HOURS.length;
  const startOffset =
    ((session.start.getHours() + session.start.getMinutes() / 60 - HOURS[0]) / totalHours) * 100;
  const duration = differenceInMinutes(session.end, session.start) / 60;
  const width = (duration / totalHours) * 100;
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelect(session.id);
      }}
      className={cn(
        'absolute top-2 rounded-2xl border px-3 py-2 text-left text-xs shadow transition',
        session.modality === 'Home'
          ? 'border-amber-200 bg-amber-50/70'
          : session.modality === 'Telehealth'
            ? 'border-indigo-200 bg-indigo-50/70'
            : 'border-emerald-200 bg-emerald-50/70'
      )}
      style={{ left: `${startOffset}%`, width: `${Math.max(width * 100, 12)}%` }}
    >
      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-400">{session.serviceCode}</p>
      <p className="text-sm font-semibold text-slate-900">{session.clientName}</p>
      <p className="text-[0.65rem] text-slate-500">
        {format(session.start, 'h:mm a')} – {format(session.end, 'h:mm a')}
      </p>
    </button>
  );
}

function DraftSessionCard({ slot }: { slot: DraftSlot }) {
  const totalHours = HOURS.length;
  const startOffset =
    ((slot.start.getHours() + slot.start.getMinutes() / 60 - HOURS[0]) / totalHours) * 100;
  const duration = differenceInMinutes(slot.end, slot.start) / 60;
  const width = (duration / totalHours) * 100;
  return (
    <div
      className="absolute top-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-3 py-2 text-xs text-slate-500"
      style={{ left: `${startOffset}%`, width: `${Math.max(width * 100, 12)}%` }}
    >
      Draft {format(slot.start, 'h:mm')}–{format(slot.end, 'h:mm')}
    </div>
  );
}

function QuickCreatePanel({
  slot,
  clients,
  onCreate,
  onCancel
}: {
  slot: DraftSlot;
  clients: typeof schedulerSnapshot.clients;
  onCreate: (payload: { title: string; clientName: string; serviceCode: string; location: 'Center' | 'Home' | 'School' | 'Telehealth' }) => void;
  onCancel: () => void;
}) {
  const [clientName, setClientName] = useState(clients[0]?.name ?? '');
  const [title, setTitle] = useState('Direct ABA');
  const [serviceCode, setServiceCode] = useState('97153');
  const [location, setLocation] = useState<'Center' | 'Home' | 'School' | 'Telehealth'>('Center');
  const recommendedClients = clients.slice(0, 3);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-lg">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Create session</p>
      <h3 className="mt-1 text-xl font-semibold text-slate-900">Wed · {format(slot.start, 'h:mm a')} – {format(slot.end, 'h:mm a')}</h3>
      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Staff</span>
          <div className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900">{slot.laneId}</div>
        </label>
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Client</span>
          <select value={clientName} onChange={(event) => setClientName(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-2">
            {clients.map((client) => (
              <option key={client.id}>{client.name}</option>
            ))}
          </select>
          <div className="text-xs text-slate-500">
            Suggestions:
            <div className="mt-1 space-y-1">
              {recommendedClients.map((client) => (
                <button key={client.id} type="button" onClick={() => setClientName(client.name)} className="w-full rounded-2xl border border-slate-100 px-3 py-1 text-left">
                  {client.name} · Needs {Math.max(client.hoursPrescribed - client.hoursDelivered, 0)} hrs
                </button>
              ))}
            </div>
          </div>
        </label>
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Service</span>
          <select
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setServiceCode(event.target.value.includes('Parent') ? '97156' : '97153');
            }}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2"
          >
            <option>Direct ABA</option>
            <option>Parent coaching</option>
            <option>Supervision</option>
            <option>Assessment</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Care setting</span>
          <select value={location} onChange={(event) => setLocation(event.target.value as typeof location)} className="w-full rounded-2xl border border-slate-200 px-3 py-2">
            {CARE_SETTINGS.map((setting) => (
              <option key={setting}>{setting}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="flex-1 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => onCreate({ clientName, title, serviceCode, location })}
        >
          Create
        </button>
      </div>
    </div>
  );
}
