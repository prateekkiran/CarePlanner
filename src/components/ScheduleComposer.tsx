'use client';

import { useMemo, useState } from 'react';
import { addMinutes, format } from 'date-fns';
import { AlertTriangle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';

import { schedulerSnapshot } from '@/lib/mockData';
import type { AuthorizationSummary, RoomResource } from '@/lib/types';
import { cn } from '@/lib/utils';

type StepId = 'client' | 'service' | 'schedule' | 'staff' | 'location' | 'recurrence' | 'review';

type StepConfig = {
  id: StepId;
  label: string;
  helper: string;
};

const steps: StepConfig[] = [
  { id: 'client', label: 'Client', helper: 'Load context + auths' },
  { id: 'service', label: 'Intent & service', helper: 'Filter by coverage' },
  { id: 'schedule', label: 'When', helper: 'Respect clinic hours & auth' },
  { id: 'staff', label: 'Team', helper: 'Surface eligible staff' },
  { id: 'location', label: 'Location', helper: 'POS, EVV rules' },
  { id: 'recurrence', label: 'Recurrence', helper: 'Align w/ plan' },
  { id: 'review', label: 'Review & confirm', helper: 'Show validations' }
];

type IntentId = 'ongoing' | 'assessment' | 'parent' | 'supervision' | 'other';

const intents: { id: IntentId; label: string; description: string }[] = [
  { id: 'ongoing', label: 'Ongoing ABA therapy', description: 'Weekly prescription hours' },
  { id: 'assessment', label: 'Assessment / Reassessment', description: 'Initial or renewal authorizations' },
  { id: 'parent', label: 'Parent training', description: 'Caregiver collaboration, telehealth friendly' },
  { id: 'supervision', label: 'Supervision', description: 'BCBA oversight & fidelity checks' },
  { id: 'other', label: 'Other / Non-billable', description: 'Team syncs, transition planning' }
];

type ServiceTemplate = {
  id: string;
  intent: IntentId;
  label: string;
  code: string;
  description: string;
  defaultDuration: number;
  allowedRoles: string[];
  modalities: Array<'Center' | 'Home' | 'School' | 'Telehealth'>;
  recommendedFrequency: string;
  billable: boolean;
};

const serviceCatalog: ServiceTemplate[] = [
  {
    id: 'srv-97153',
    intent: 'ongoing',
    label: 'Direct ABA therapy',
    code: '97153',
    description: 'RBT-led sessions with BCBA oversight, 2-hr default.',
    defaultDuration: 120,
    allowedRoles: ['RBT', 'BCBA'],
    modalities: ['Center', 'Home'],
    recommendedFrequency: '4x / week · 2 hr',
    billable: true
  },
  {
    id: 'srv-97155',
    intent: 'supervision',
    label: 'Adaptive behavior treatment w/ protocol modification',
    code: '97155',
    description: 'BCBA intensive supervision or complex case work.',
    defaultDuration: 90,
    allowedRoles: ['BCBA'],
    modalities: ['Center', 'Home', 'School'],
    recommendedFrequency: '2x / week · 1.5 hr',
    billable: true
  },
  {
    id: 'srv-97156',
    intent: 'parent',
    label: 'Family adaptive behavior treatment guidance',
    code: '97156',
    description: 'Parent/caregiver coaching, often telehealth.',
    defaultDuration: 60,
    allowedRoles: ['BCBA'],
    modalities: ['Telehealth', 'Center'],
    recommendedFrequency: '1x / week · 1 hr',
    billable: true
  },
  {
    id: 'srv-97151',
    intent: 'assessment',
    label: 'ABA assessment / reevaluation',
    code: '97151',
    description: 'Initial or periodic re-assessments, BCBA only.',
    defaultDuration: 150,
    allowedRoles: ['BCBA'],
    modalities: ['Center', 'Home'],
    recommendedFrequency: 'As prescribed',
    billable: true
  },
  {
    id: 'srv-TEAM',
    intent: 'other',
    label: 'Care team sync (non-billable)',
    code: 'TEAM-HUDDLE',
    description: 'Internal collaboration, progress, travel planning.',
    defaultDuration: 45,
    allowedRoles: ['BCBA', 'RBT'],
    modalities: ['Center', 'Telehealth'],
    recommendedFrequency: 'Ad-hoc',
    billable: false
  }
];

type LocationType = 'Center' | 'Home' | 'School' | 'Telehealth';

type LocationCard = {
  type: LocationType;
  label: string;
  pos: string;
  description: string;
  evv: boolean;
};

const locationCards: LocationCard[] = [
  { type: 'Center', label: 'Center', pos: 'POS 11 · Office', description: 'Austin & round rock pods with room inventory.', evv: false },
  { type: 'Home', label: 'Home / Community', pos: 'POS 12 · Home', description: 'Pulling client address & EVV automatically.', evv: true },
  { type: 'School', label: 'School', pos: 'POS 03 · School', description: 'District contacts + resource rooms', evv: false },
  { type: 'Telehealth', label: 'Telehealth', pos: 'POS 02 · Telehealth', description: 'Auto-generate secure session links.', evv: false }
];

const durationOptions = [30, 45, 60, 90, 120, 150, 180];
const clinicHours = { start: 8, end: 18 };
const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface ScheduleComposerProps {
  onClose: () => void;
}

export function ScheduleComposer({ onClose }: ScheduleComposerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [clientQuery, setClientQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>();
  const [selectedIntent, setSelectedIntent] = useState<IntentId | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string>();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>();
  const [selectedLocationType, setSelectedLocationType] = useState<LocationType>('Center');
  const [selectedRoomId, setSelectedRoomId] = useState<string>();
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
  const [recurrenceOccurrences, setRecurrenceOccurrences] = useState(4);
  const [notes, setNotes] = useState('');
  const [autoTelehealthLink, setAutoTelehealthLink] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const clients = schedulerSnapshot.clients;
  const selectedClient = useMemo(() => clients.find((client) => client.id === selectedClientId), [clients, selectedClientId]);
  const authorizations = schedulerSnapshot.authorizations;
  const clientAuth: AuthorizationSummary | undefined = selectedClient ? authorizations[selectedClient.id] : undefined;

  const filteredClients = useMemo(() => {
    const query = clientQuery.trim().toLowerCase();
    if (!query) return clients.slice(0, 4);
    return clients.filter((client) => client.name.toLowerCase().includes(query) || client.id.toLowerCase().includes(query));
  }, [clients, clientQuery]);

  const selectedService = useMemo(() => serviceCatalog.find((service) => service.id === selectedServiceId), [selectedServiceId]);
  const serviceOptions = useMemo(() => serviceCatalog.filter((service) => !selectedIntent || service.intent === selectedIntent), [selectedIntent]);

  const staffSuggestions = useMemo(() => {
    const pool = schedulerSnapshot.availability;
    const assignedNames = selectedClient ? [selectedClient.bcba, selectedClient.rbt].filter(Boolean) : [];
    return pool
      .filter((staff) => {
        if (!selectedService) return true;
        return selectedService.allowedRoles.includes(staff.credential);
      })
      .map((staff) => {
        const assigned = assignedNames.some((name) => staff.staffName.includes(name.split(',')[0]));
        const loadRatio = staff.load / staff.target;
        const loadStatus = loadRatio > 1 ? 'Over capacity' : loadRatio > 0.8 ? 'Tight day' : 'Healthy load';
        const availabilityStatus = selectedStartTime ? (loadRatio > 1 ? '⚠ overlap risk' : '✅ available') : 'Select time first';
        return { ...staff, assigned, loadRatio, loadStatus, availabilityStatus };
      })
      .sort((a, b) => {
        if (a.assigned && !b.assigned) return -1;
        if (!a.assigned && b.assigned) return 1;
        return a.loadRatio - b.loadRatio;
      });
  }, [selectedClient, selectedService, selectedStartTime]);

  const centerRooms = useMemo(() => {
    return schedulerSnapshot.rooms.filter((room) => room.location.includes('Center'));
  }, []);

  const estimatedEndTime = useMemo(() => {
    if (!selectedDate || !selectedStartTime || !selectedDuration) return '';
    const [hours, minutes] = selectedStartTime.split(':').map(Number);
    const start = new Date(selectedDate);
    start.setHours(hours, minutes, 0, 0);
    const end = addMinutes(start, selectedDuration);
    return format(end, 'hh:mm a');
  }, [selectedDate, selectedStartTime, selectedDuration]);

  const outsideClinicHours = useMemo(() => {
    if (!selectedStartTime || !selectedDuration) return false;
    const [hours, minutes] = selectedStartTime.split(':').map(Number);
    const startFloat = hours + minutes / 60;
    const endFloat = startFloat + selectedDuration / 60;
    return startFloat < clinicHours.start || endFloat > clinicHours.end;
  }, [selectedStartTime, selectedDuration]);

  const isWeekend = useMemo(() => {
    if (!selectedDate) return false;
    const day = new Date(selectedDate).getDay();
    return day === 0;
  }, [selectedDate]);

  const recurrenceInstances = recurrenceEnabled ? Math.max(1, recurrenceOccurrences) * Math.max(1, recurrenceDays.length) : 1;
  const projectedMinutes = (selectedDuration ?? 0) * recurrenceInstances;
  const exceedsAuth = Boolean(clientAuth && clientAuth.remainingMinutes < projectedMinutes);

  const currentStep = steps[stepIndex];
  const stepCompletion: Record<StepId, boolean> = {
    client: Boolean(selectedClient),
    service: Boolean(selectedClient && selectedIntent && selectedService),
    schedule: Boolean(selectedDate && selectedDuration && selectedStartTime && !outsideClinicHours && !isWeekend && (clientAuth ? clientAuth.remainingMinutes >= (selectedDuration ?? 0) : true)),
    staff: Boolean(selectedStaffId),
    location: Boolean(selectedLocationType && (selectedLocationType !== 'Center' || !centerRooms.length || selectedRoomId)),
    recurrence: !recurrenceEnabled || (recurrenceDays.length > 0 && recurrenceOccurrences > 0 && !exceedsAuth),
    review: Boolean(selectedClient && selectedService && selectedDate && selectedStartTime && selectedStaffId)
  };

  const canProceed = stepCompletion[currentStep.id];
  const atReview = currentStep.id === 'review';
  const canSubmit =
    stepCompletion.client &&
    stepCompletion.service &&
    stepCompletion.schedule &&
    stepCompletion.staff &&
    stepCompletion.location &&
    stepCompletion.recurrence;

  const handleNext = () => {
    if (!canProceed || stepIndex >= steps.length - 1) return;
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onClose();
    }, 850);
  };

  const renderStep = () => {
    switch (currentStep.id) {
      case 'client':
        return renderClientStep();
      case 'service':
        return renderServiceStep();
      case 'schedule':
        return renderScheduleStep();
      case 'staff':
        return renderStaffStep();
      case 'location':
        return renderLocationStep();
      case 'recurrence':
        return renderRecurrenceStep();
      case 'review':
        return renderReviewStep();
      default:
        return null;
    }
  };

  function renderClientStep() {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Search or pick a recent client to load authorizations, care team, and location norms.</p>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-inner">
          <input
            value={clientQuery}
            onChange={(event) => setClientQuery(event.target.value)}
            placeholder="Search by client or ID"
            className="w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="space-y-2">
          {filteredClients.map((client) => {
            const auth = authorizations[client.id];
            const active = client.status === 'Active';
            return (
              <button
                key={client.id}
                type="button"
                onClick={() => {
                  setSelectedClientId(client.id);
                  const inferred = inferLocationType(client.location);
                  setSelectedLocationType(inferred);
                  if (inferred !== 'Center') {
                    setSelectedRoomId(undefined);
                  }
                }}
                className={cn(
                  'w-full rounded-2xl border px-4 py-3 text-left transition',
                  selectedClientId === client.id ? 'border-emerald-300 bg-emerald-50/80' : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{client.name}</p>
                    <p className="text-xs text-slate-500">
                      {client.location} · Prescribed {client.hoursPrescribed}h / wk
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs',
                      active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    )}
                  >
                    {client.status}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>BCBA: {client.bcba}</span>
                  {client.rbt !== '—' && <span>RBT: {client.rbt}</span>}
                  <span>
                    Auth:{' '}
                    {auth ? `${auth.remainingMinutes} min remaining · expires ${format(new Date(auth.expiresOn), 'MMM d')}` : 'Missing'}
                  </span>
                </div>
                {!auth && (
                  <p className="mt-2 text-xs text-rose-500">
                    {client.status === 'Active' ? 'No active authorization detected — schedule will be non-billable.' : 'Client is not billable yet.'}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderServiceStep() {
    if (!selectedClient) {
      return <p className="text-sm text-slate-500">Select a client first to see intents and services.</p>;
    }

    const recommendedCodes = new Set(clientAuth?.serviceCodes ?? []);
    const authorizedServices = serviceOptions.filter((service) => recommendedCodes.has(service.code));
    const otherServices = serviceOptions.filter((service) => !recommendedCodes.has(service.code));

    return (
      <div className="space-y-5">
        <p className="text-sm text-slate-500">What are we scheduling for {selectedClient.name}? Pick intent, then the service that fits coverage.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {intents.map((intent) => (
            <button
              key={intent.id}
              type="button"
              onClick={() => {
                setSelectedIntent(intent.id);
                setSelectedServiceId(undefined);
              }}
              className={cn(
                'rounded-2xl border p-4 text-left',
                selectedIntent === intent.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <p className="font-semibold">{intent.label}</p>
              <p className={cn('text-sm', selectedIntent === intent.id ? 'text-white/70' : 'text-slate-500')}>{intent.description}</p>
            </button>
          ))}
        </div>
        {selectedIntent &&
          (serviceOptions.length > 0 ? (
            <div className="space-y-3">
              {authorizedServices.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">Recommended (covered)</p>
                  {authorizedServices.map((service) => renderServiceCard(service, true))}
                </div>
              )}
              {otherServices.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Other internal / non-billable</p>
                  {otherServices.map((service) => renderServiceCard(service, false))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No services available for this intent yet.</p>
          ))}
      </div>
    );
  }

  function renderServiceCard(service: ServiceTemplate, covered: boolean) {
    return (
      <button
        key={service.id}
        type="button"
        onClick={() => {
          setSelectedServiceId(service.id);
          const remaining = clientAuth?.remainingMinutes ?? service.defaultDuration;
          setSelectedDuration(Math.min(service.defaultDuration, remaining));
        }}
        className={cn(
          'w-full rounded-2xl border px-4 py-3 text-left transition',
          selectedServiceId === service.id ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900">
              {service.label} · {service.code}
            </p>
            <p className="text-sm text-slate-500">{service.description}</p>
          </div>
          {covered ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">Covered</span>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">Non-billable</span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          <span>Default {service.defaultDuration} min</span>
          <span>Staff: {service.allowedRoles.join(', ')}</span>
          <span>Modalities: {service.modalities.join(', ')}</span>
        </div>
      </button>
    );
  }

  function renderScheduleStep() {
    if (!selectedService) {
      return <p className="text-sm text-slate-500">Pick a service to unlock scheduling.</p>;
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Pick a date, duration, and start time. We limit by clinic hours ({clinicHours.start}a - {clinicHours.end}p) and authorization.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Date</span>
            <input
              type="date"
              min={today}
              value={selectedDate}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedDate(value);
                if (value) {
                  const dow = format(new Date(value), 'EEE');
                  setRecurrenceDays((prev) => (prev.length ? prev : [dow]));
                }
              }}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Start time</span>
            <input
              type="time"
              value={selectedStartTime}
              onChange={(event) => setSelectedStartTime(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">End time</span>
            <div className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-700">{estimatedEndTime || 'Auto-calculated'}</div>
          </label>
        </div>
        {clientAuth && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-700">
            Remaining authorized time: {clientAuth.remainingMinutes} min · Auth expires {format(new Date(clientAuth.expiresOn), 'MMM d')}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          {durationOptions.map((duration) => {
            const disabled = Boolean(clientAuth && duration > clientAuth.remainingMinutes);
            return (
              <button
                type="button"
                key={duration}
                disabled={disabled}
                onClick={() => setSelectedDuration(duration)}
                className={cn(
                  'rounded-2xl border px-3 py-2 text-sm transition',
                  disabled && 'cursor-not-allowed opacity-40',
                  selectedDuration === duration ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 hover:border-slate-300'
                )}
              >
                {duration} min
              </button>
            );
          })}
        </div>
        {isWeekend && <InlineAlert message="Clinic is closed on Sundays. Choose another date." />}
        {outsideClinicHours && (
          <InlineAlert message={`This slot would extend past clinic hours (${clinicHours.end}:00). Adjust start time or duration.`} />
        )}
      </div>
    );
  }

  function renderStaffStep() {
    if (!selectedDuration || !selectedDate || !selectedService) {
      return <p className="text-sm text-slate-500">Lock in date, duration, and service to see eligible staff.</p>;
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">We prioritize assigned staff, correct credentials, and those under capacity.</p>
        <div className="space-y-2">
          {staffSuggestions.map((staff) => (
            <button
              key={staff.staffId}
              type="button"
              onClick={() => setSelectedStaffId(staff.staffId)}
              className={cn(
                'w-full rounded-2xl border px-4 py-3 text-left transition',
                selectedStaffId === staff.staffId ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{staff.staffName}</p>
                  <p className="text-xs text-slate-500">
                    {staff.credential} · {staff.location}
                  </p>
                </div>
                {staff.assigned && <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">On care team</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>
                  Load: {staff.load}/{staff.target} hrs ({Math.round(staff.loadRatio * 100)}%)
                </span>
                <span>{staff.loadStatus}</span>
                <span>{staff.availabilityStatus}</span>
              </div>
            </button>
          ))}
          {staffSuggestions.length === 0 && (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-600">
              No staff meet the credential filters for this service. Adjust service or consult clinical director.
            </p>
          )}
        </div>
      </div>
    );
  }

  function renderLocationStep() {
    if (!selectedService) {
      return <p className="text-sm text-slate-500">Pick a service first.</p>;
    }

    const rooms = centerRooms;

    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Choose location type. We take care of POS codes, EVV, and resource density.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {locationCards.map((card) => {
            const disabled = !selectedService.modalities.includes(card.type);
            return (
              <button
                type="button"
                key={card.type}
                disabled={disabled}
                onClick={() => {
                  setSelectedLocationType(card.type);
                  if (card.type !== 'Center') {
                    setSelectedRoomId(undefined);
                  }
                }}
                className={cn(
                  'rounded-2xl border px-4 py-3 text-left transition',
                  disabled && 'cursor-not-allowed opacity-40',
                  selectedLocationType === card.type ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <p className="font-semibold text-slate-900">{card.label}</p>
                <p className="text-sm text-slate-500">{card.description}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>{card.pos}</span>
                  {card.evv && <span>EVV auto-enabled</span>}
                </div>
              </button>
            );
          })}
        </div>
        {selectedLocationType === 'Center' && rooms.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Rooms</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {rooms.map((room: RoomResource) => (
                <button
                  type="button"
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={cn(
                    'rounded-2xl border px-3 py-2 text-left text-sm',
                    selectedRoomId === room.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <p className="font-semibold">{room.name}</p>
                  <p className="text-xs">
                    Load {room.bookedHours}/{room.availableHours} hrs · {room.location}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
        {selectedLocationType === 'Home' && selectedClient && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            EVV pin + caregiver signature required. Travel buffer from {selectedClient.location}: 20 min → OK.
          </div>
        )}
        {selectedLocationType === 'Telehealth' && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={autoTelehealthLink}
              onChange={() => setAutoTelehealthLink((prev) => !prev)}
              className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
            />
            Auto-generate secure telehealth link + host instructions
          </label>
        )}
      </div>
    );
  }

  function renderRecurrenceStep() {
    if (!selectedDuration) {
      return <p className="text-sm text-slate-500">Finish scheduling basics to configure recurrence.</p>;
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Extend this session across weeks. We forecast authorization usage automatically.</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setRecurrenceEnabled(false)}
            className={cn(
              'rounded-full px-4 py-2 text-sm',
              !recurrenceEnabled ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600'
            )}
          >
            Single session
          </button>
          <button
            type="button"
            onClick={() => setRecurrenceEnabled(true)}
            className={cn(
              'rounded-full px-4 py-2 text-sm',
              recurrenceEnabled ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600'
            )}
          >
            Build a series
          </button>
        </div>
        {recurrenceEnabled && selectedService && (
          <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <p className="font-semibold">Treatment plan suggestion:</p>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-600"
                onClick={() => setRecurrenceDays(['Mon', 'Wed', 'Thu'])}
              >
                Apply {selectedService.recommendedFrequency}
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Days</p>
              <div className="flex flex-wrap gap-2">
                {weekdayOrder.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setRecurrenceDays((prev) =>
                        prev.includes(day) ? prev.filter((entry) => entry !== day) : [...prev, day]
                      )
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-sm',
                      recurrenceDays.includes(day) ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">End after</span>
              <input
                type="number"
                min={1}
                max={26}
                value={recurrenceOccurrences}
                onChange={(event) => {
                  const nextValue = Math.max(1, Math.min(26, Number(event.target.value) || 0));
                  setRecurrenceOccurrences(nextValue);
                }}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-700"
              />
              <p className="text-xs text-slate-500">weekly cadence(s)</p>
            </label>
            <div
              className={cn(
                'rounded-2xl px-4 py-3 text-sm',
                exceedsAuth ? 'border border-rose-200 bg-rose-50 text-rose-600' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              )}
            >
              {recurrenceInstances} instances · {projectedMinutes} min projected ·{' '}
              {exceedsAuth
                ? `Exceeds auth by ${projectedMinutes - (clientAuth?.remainingMinutes ?? 0)} min`
                : 'Within authorization'}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderReviewStep() {
    if (!selectedClient || !selectedService || !selectedDate || !selectedStartTime || !selectedDuration) {
      return <p className="text-sm text-slate-500">Complete the previous steps for a summary.</p>;
    }

    const reviewDate = format(new Date(selectedDate), 'EEEE, MMM d');
    const startDateObj = new Date(selectedDate);
    const [startHours, startMinutes] = selectedStartTime.split(':').map(Number);
    startDateObj.setHours(startHours, startMinutes, 0, 0);
    const startLabel = format(startDateObj, 'hh:mm a');

    return (
      <div className="space-y-5">
        <p className="text-sm text-slate-500">We summarize every automation + validation so you can commit with confidence.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Client & Service</p>
            <p className="mt-2 font-semibold text-slate-900">{selectedClient.name}</p>
            <p className="text-sm text-slate-500">
              {selectedService.label} ({selectedService.code}) · {selectedService.intent}
            </p>
            {clientAuth && (
              <p className="mt-3 text-xs text-slate-500">
                Funding: {clientAuth.payer} · Remaining {clientAuth.remainingMinutes - (selectedDuration ?? 0)} min after this session
              </p>
            )}
          </div>
          <div className="rounded-3xl border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">When & Where</p>
            <p className="mt-2 font-semibold text-slate-900">
              {reviewDate} · {startLabel} - {estimatedEndTime}
            </p>
            <p className="text-sm text-slate-500">
              {selectedLocationType}
              {selectedLocationType === 'Center' && selectedRoomId && ` · ${centerRooms.find((room) => room.id === selectedRoomId)?.name}`}
            </p>
            {recurrenceEnabled && (
              <p className="mt-3 text-xs text-slate-500">
                Recurs {recurrenceDays.join(', ')} for {recurrenceOccurrences} wk · {recurrenceInstances} instances
              </p>
            )}
          </div>
          <div className="rounded-3xl border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Staff & risk</p>
            <p className="mt-2 text-sm text-slate-500">
              Delivering clinician:{' '}
              <span className="font-semibold text-slate-900">
                {staffSuggestions.find((staff) => staff.staffId === selectedStaffId)?.staffName ?? '—'}
              </span>
            </p>
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Authorization limits respected
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {selectedLocationType === 'Home' ? 'EVV + caregiver PIN added' : 'POS + compliance ready'}
              </p>
              {exceedsAuth && (
                <p className="flex items-center gap-2 text-rose-500">
                  <AlertTriangle className="h-4 w-4" />
                  Recurrence exceeds authorization
                </p>
              )}
            </div>
          </div>
          <label className="rounded-3xl border border-slate-200 p-4">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Notes to team</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Travel, caregiver context, validation overrides"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-3xl space-y-6 rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-2xl">
        <header className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Create appointment</p>
              <h3 className="text-3xl font-semibold text-slate-900">Schedule session</h3>
            </div>
            <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">
              Close
            </button>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <span
                  className={cn(
                    'grid size-6 place-items-center rounded-full border text-[0.6rem]',
                    index === stepIndex ? 'border-slate-900 text-slate-900' : 'border-slate-200'
                  )}
                >
                  {index + 1}
                </span>
                <span className={cn(index === stepIndex ? 'text-slate-900' : '')}>{step.label}</span>
                {index < steps.length - 1 && <ChevronRight className="h-3 w-3 text-slate-300" />}
              </div>
            ))}
          </div>
        </header>
        <section className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5">{renderStep()}</section>
        <footer className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepIndex === 0}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 disabled:opacity-40"
          >
            Back
          </button>
          {!atReview && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Next
            </button>
          )}
          {atReview && (
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Scheduling…' : 'Schedule session'}
            </button>
          )}
          <div className="ml-auto text-xs uppercase tracking-[0.2em] text-slate-400">{currentStep.helper}</div>
        </footer>
      </form>
    </div>
  );
}

function InlineAlert({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/90 px-3 py-2 text-xs text-rose-600">
      <AlertTriangle className="h-4 w-4" />
      {message}
    </div>
  );
}

function inferLocationType(location: string): LocationType {
  const normalized = location.toLowerCase();
  if (normalized.includes('home')) return 'Home';
  if (normalized.includes('telehealth') || normalized.includes('virtual')) return 'Telehealth';
  if (normalized.includes('school')) return 'School';
  return 'Center';
}
