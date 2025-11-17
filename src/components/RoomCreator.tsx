'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

const locations = ['Austin - North Center', 'Telehealth Hub', 'Jefferson Elementary'];

type StepId = 'basic' | 'capacity' | 'availability' | 'review';

const steps: { id: StepId; label: string; helper: string }[] = [
  { id: 'basic', label: 'Basic info', helper: 'Name + location' },
  { id: 'capacity', label: 'Capacity & type', helper: 'Room behavior' },
  { id: 'availability', label: 'Availability & rules', helper: 'Hours + constraints' },
  { id: 'review', label: 'Review & create', helper: 'Confirm details' }
];

const roomTypes = ['Individual therapy', 'Group therapy', 'Assessment', 'Multipurpose', 'Telehealth booth'];
const sessionTypes = ['Direct ABA', 'Group ABA', 'Assessment', 'Parent training', 'Supervision'];

export type RoomStatus = 'Active' | 'Inactive';

export type NewRoomPayload = {
  name: string;
  code: string;
  location: string;
  status: RoomStatus;
  description: string;
  displayType: string;
  maxClients: number;
  maxStaff: number;
  attributes: string[];
  allowedSessions: string[];
  availability: {
    inheritLocation: boolean;
    customBlocks: { day: string; start: string; end: string; enabled: boolean }[];
    allowOverlap: boolean;
    maxConcurrent: number;
    highIntensitySafe: boolean;
    notes: string;
  };
};

type RoomCreatorProps = {
  onClose: () => void;
  onSave: (payload: NewRoomPayload) => void;
};

export function RoomCreator({ onClose, onSave }: RoomCreatorProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [basic, setBasic] = useState({
    name: '',
    code: '',
    location: locations[0],
    status: 'Active',
    description: ''
  });
  const [capacity, setCapacity] = useState({
    type: 'Individual therapy',
    maxClients: 1,
    maxStaff: 2,
    attributes: ['Quiet room']
  });
  const [availability, setAvailability] = useState({
    inheritLocation: true,
    customBlocks: [
      { day: 'Mon', start: '09:00', end: '18:00', enabled: true },
      { day: 'Tue', start: '09:00', end: '18:00', enabled: true },
      { day: 'Wed', start: '09:00', end: '18:00', enabled: true },
      { day: 'Thu', start: '09:00', end: '18:00', enabled: true },
      { day: 'Fri', start: '09:00', end: '18:00', enabled: true }
    ],
    allowOverlap: false,
    maxConcurrent: 1,
    allowedSessions: ['Direct ABA'],
    highIntensitySafe: true,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const currentStep = steps[stepIndex];
  const preview = useMemo(() => {
    return {
      name: basic.name || 'New room',
      location: basic.location,
      status: basic.status,
      type: capacity.type,
      capacity: capacity.maxClients,
      rules: availability.allowedSessions.join(', '),
      overlap: availability.allowOverlap ? 'Overlap allowed' : 'One session at a time'
    };
  }, [basic, capacity, availability]);

  const canProceed = (() => {
    if (currentStep.id === 'basic') {
      return Boolean(basic.name && basic.location);
    }
    if (currentStep.id === 'capacity') {
      return capacity.maxClients >= 1;
    }
    if (currentStep.id === 'availability') {
      return availability.inheritLocation || availability.customBlocks.some((block) => block.enabled);
    }
    return true;
  })();

  const handleSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      onSave({
        name: basic.name,
        code: basic.code,
        location: basic.location,
        status: basic.status as RoomStatus,
        description: basic.description,
        displayType: capacity.type,
        maxClients: capacity.maxClients,
        maxStaff: capacity.maxStaff,
        attributes: capacity.attributes,
        allowedSessions: availability.allowedSessions,
        availability: {
          inheritLocation: availability.inheritLocation,
          customBlocks: availability.customBlocks,
          allowOverlap: availability.allowOverlap,
          maxConcurrent: availability.maxConcurrent,
          highIntensitySafe: availability.highIntensitySafe,
          notes: availability.notes
        }
      });
      setSubmitting(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 px-4 py-10">
      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-[1.7fr,1fr]">
        <section className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-2xl">
          <header className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Create room</p>
              <h3 className="text-3xl font-semibold text-slate-900">New space</h3>
            </div>
            <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600">
              Close
            </button>
          </header>
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <span
                  className={cn(
                    'grid size-7 place-items-center rounded-full border text-[0.65rem]',
                    stepIndex === index ? 'border-slate-900 text-slate-900' : 'border-slate-200'
                  )}
                >
                  {index + 1}
                </span>
                <span className={cn(stepIndex === index ? 'text-slate-900' : '')}>{step.label}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">{renderStep()}</div>
          <footer className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={stepIndex === 0}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs text-slate-600 disabled:opacity-40"
            >
              Back
            </button>
            {currentStep.id !== 'review' ? (
              <button
                type="button"
                onClick={() => setStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                disabled={!canProceed}
                className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold text-white"
              >
                {submitting ? 'Creating…' : 'Create room'}
              </button>
            )}
            <span className="ml-auto text-xs text-slate-400">{currentStep.helper}</span>
          </footer>
        </section>
        <aside className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Preview</p>
          <h4 className="text-xl font-semibold text-slate-900">{preview.name}</h4>
          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex flex-wrap gap-2">
              <Chip label={preview.location} />
              <Chip label={preview.status} />
              <Chip label={preview.type} />
            </div>
            <p>Capacity: {preview.capacity} clients</p>
            <p>Allowed sessions: {preview.rules || 'None selected'}</p>
            <p>{preview.overlap}</p>
          </div>
        </aside>
      </div>
    </div>
  );

  function renderStep() {
    switch (currentStep.id) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Room name</span>
                <input
                  value={basic.name}
                  onChange={(event) => setBasic((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                  placeholder="Group Room A"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Room code</span>
                <input
                  value={basic.code}
                  onChange={(event) => setBasic((prev) => ({ ...prev, code: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                  placeholder="C1-RM1"
                />
              </label>
            </div>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Location</span>
              <select
                value={basic.location}
                onChange={(event) => setBasic((prev) => ({ ...prev, location: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2"
              >
                {locations.map((location) => (
                  <option key={location}>{location}</option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              {['Active', 'Inactive'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setBasic((prev) => ({ ...prev, status }))}
                  className={cn(
                    'rounded-full border px-4 py-1 text-xs',
                    basic.status === status ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Description</span>
              <textarea
                value={basic.description}
                onChange={(event) => setBasic((prev) => ({ ...prev, description: event.target.value }))}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                placeholder="Sensory friendly room with observation window."
              />
            </label>
          </div>
        );
      case 'capacity':
        return (
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Room type</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {roomTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setCapacity((prev) => ({
                      ...prev,
                      type,
                      maxClients: type === 'Telehealth booth' ? 1 : prev.maxClients
                    }))
                  }
                  className={cn(
                    'rounded-2xl border px-3 py-2 text-left text-xs',
                    capacity.type === type ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Max clients</span>
                <input
                  type="number"
                  min={1}
                  value={capacity.maxClients}
                  onChange={(event) => setCapacity((prev) => ({ ...prev, maxClients: Number(event.target.value) }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Max staff</span>
                <input
                  type="number"
                  min={1}
                  value={capacity.maxStaff}
                  onChange={(event) => setCapacity((prev) => ({ ...prev, maxStaff: Number(event.target.value) }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Attributes</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Quiet room', 'Observation window', 'Wheelchair accessible', 'Telehealth-ready'].map((attribute) => (
                  <button
                    key={attribute}
                    type="button"
                    onClick={() =>
                      setCapacity((prev) => ({
                        ...prev,
                        attributes: prev.attributes.includes(attribute)
                          ? prev.attributes.filter((entry) => entry !== attribute)
                          : [...prev.attributes, attribute]
                      }))
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs',
                      capacity.attributes.includes(attribute)
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-500'
                    )}
                  >
                    {attribute}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'availability':
        return (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={availability.inheritLocation}
                onChange={() => setAvailability((prev) => ({ ...prev, inheritLocation: !prev.inheritLocation }))}
              />
              Use location default hours
            </label>
            {!availability.inheritLocation && (
              <div className="space-y-2">
                {availability.customBlocks.map((block, index) => (
                  <div key={block.day} className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-2 text-xs">
                    <button
                      type="button"
                      onClick={() => toggleBlock(index)}
                      className={cn(
                        'rounded-full px-3 py-1',
                        block.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {block.day}
                    </button>
                    <input
                      type="time"
                      value={block.start}
                      onChange={(event) => updateBlock(index, { ...block, start: event.target.value })}
                      className="rounded-2xl border border-slate-200 px-3 py-1"
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={block.end}
                      onChange={(event) => updateBlock(index, { ...block, end: event.target.value })}
                      className="rounded-2xl border border-slate-200 px-3 py-1"
                    />
                  </div>
                ))}
              </div>
            )}
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={availability.allowOverlap}
                onChange={() => setAvailability((prev) => ({ ...prev, allowOverlap: !prev.allowOverlap }))}
              />
              Allow overlapping bookings
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Max concurrent sessions</span>
              <input
                type="number"
                min={1}
                value={availability.maxConcurrent}
                onChange={(event) => setAvailability((prev) => ({ ...prev, maxConcurrent: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2"
              />
            </label>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Allowed session types</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sessionTypes.map((session) => (
                  <button
                    key={session}
                    type="button"
                    onClick={() =>
                      setAvailability((prev) => ({
                        ...prev,
                        allowedSessions: prev.allowedSessions.includes(session)
                          ? prev.allowedSessions.filter((entry) => entry !== session)
                          : [...prev.allowedSessions, session]
                      }))
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs',
                      availability.allowedSessions.includes(session)
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-500'
                    )}
                  >
                    {session}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={availability.highIntensitySafe}
                onChange={() => setAvailability((prev) => ({ ...prev, highIntensitySafe: !prev.highIntensitySafe }))}
              />
              Suitable for high-intensity behavior cases
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Notes for schedulers</span>
              <textarea
                value={availability.notes}
                onChange={(event) => setAvailability((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                placeholder="Not ideal for transitions after 4pm."
              />
            </label>
          </div>
        );
      case 'review':
        return (
          <div className="space-y-3 text-xs text-slate-600">
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Basic info</p>
              <p className="text-sm text-slate-900">
                {basic.name} {basic.code && `· ${basic.code}`}
              </p>
              <p>
                {basic.location} · {basic.status}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Type & capacity</p>
              <p className="text-sm text-slate-900">{capacity.type}</p>
              <p>
                {capacity.maxClients} clients · {capacity.maxStaff} staff
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Availability & rules</p>
              <p>{availability.inheritLocation ? 'Inheriting location hours' : 'Custom hours set'}</p>
              <p>Max concurrent: {availability.maxConcurrent}</p>
              <p>Allowed sessions: {availability.allowedSessions.join(', ') || 'None selected'}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  function toggleBlock(index: number) {
    setAvailability((prev) => ({
      ...prev,
      customBlocks: prev.customBlocks.map((block, idx) => (idx === index ? { ...block, enabled: !block.enabled } : block))
    }));
  }

  function updateBlock(index: number, block: (typeof availability.customBlocks)[number]) {
    setAvailability((prev) => ({
      ...prev,
      customBlocks: prev.customBlocks.map((entry, idx) => (idx === index ? block : entry))
    }));
  }
}

function Chip({ label }: { label: string }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-[0.65rem] font-semibold text-slate-600">{label}</span>;
}
