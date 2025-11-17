'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type ClientCreatorProps = {
  open: boolean;
  onClose: () => void;
};

type ClientStep = 'profile' | 'caregivers' | 'funding' | 'constraints' | 'review';

const steps: { id: ClientStep; label: string; helper: string }[] = [
  { id: 'profile', label: 'Client profile', helper: 'Identify the learner' },
  { id: 'caregivers', label: 'Caregivers', helper: 'Capture contacts' },
  { id: 'funding', label: 'Funding & auth', helper: 'Authorization context' },
  { id: 'constraints', label: 'Care settings', helper: 'Modalities & scheduling rules' },
  { id: 'review', label: 'Review & create', helper: 'Finalize record' }
];

const modalityOptions = ['Center', 'Home', 'School', 'Telehealth'];
const careSettings = ['Center', 'Home', 'Hybrid', 'Telehealth only'];

export function ClientCreator({ open, onClose }: ClientCreatorProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    clientId: '',
    age: 5,
    diagnosis: '',
    location: 'Austin - North Center',
    status: 'Active'
  });
  const [caregivers, setCaregivers] = useState({
    primaryName: '',
    relationship: 'Parent',
    email: '',
    phone: '',
    preferredChannel: 'SMS',
    secondaryName: '',
    secondaryEmail: ''
  });
  const [funding, setFunding] = useState({
    payer: 'Blue Cross',
    authorizationId: '',
    startDate: '',
    endDate: '',
    hoursAuthorized: 0,
    serviceCodes: ['97153', '97155']
  });
  const [constraints, setConstraints] = useState({
    careSetting: 'Hybrid',
    modalities: ['Center', 'Home'],
    preferredDays: ['Mon', 'Wed'],
    earliest: '08:00',
    latest: '18:00',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
    setProfile({
      firstName: '',
      lastName: '',
      clientId: `CLI-${Math.floor(1000 + Math.random() * 9000)}`,
      age: 5,
      diagnosis: '',
      location: 'Austin - North Center',
      status: 'Active'
    });
    setCaregivers({
      primaryName: '',
      relationship: 'Parent',
      email: '',
      phone: '',
      preferredChannel: 'SMS',
      secondaryName: '',
      secondaryEmail: ''
    });
    setFunding({
      payer: 'Blue Cross',
      authorizationId: '',
      startDate: '',
      endDate: '',
      hoursAuthorized: 0,
      serviceCodes: ['97153', '97155']
    });
    setConstraints({
      careSetting: 'Hybrid',
      modalities: ['Center', 'Home'],
      preferredDays: ['Mon', 'Wed'],
      earliest: '08:00',
      latest: '18:00',
      notes: ''
    });
    setSubmitting(false);
  }, [open]);

  const currentStep = steps[stepIndex];
  const canProceed = (() => {
    if (currentStep.id === 'profile') {
      return Boolean(profile.firstName && profile.lastName && profile.clientId);
    }
    if (currentStep.id === 'caregivers') {
      return Boolean(caregivers.primaryName && caregivers.email);
    }
    if (currentStep.id === 'funding') {
      return Boolean(funding.payer && funding.startDate && funding.endDate);
    }
    if (currentStep.id === 'constraints') {
      return constraints.modalities.length > 0;
    }
    return true;
  })();

  const preview = useMemo(() => {
    return {
      name: `${profile.firstName} ${profile.lastName}`.trim() || 'New client record',
      clientId: profile.clientId,
      status: profile.status,
      location: profile.location,
      caregiver: caregivers.primaryName,
      payer: funding.payer,
      serviceCodes: funding.serviceCodes,
      modalities: constraints.modalities,
      preferredDays: constraints.preferredDays.join(', '),
      earliest: constraints.earliest,
      latest: constraints.latest
    };
  }, [profile, caregivers, funding, constraints]);

  const handleSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onClose();
    }, 800);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-[1.7fr,1fr]">
        <section className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-2xl">
          <header className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Create client</p>
              <h3 className="text-3xl font-semibold text-slate-900">Intake & onboarding</h3>
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
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">{renderStep()}</div>
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
                disabled={!canProceed}
                onClick={() => setStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
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
                {submitting ? 'Creating…' : 'Create client'}
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
              <Chip label={preview.clientId || 'ID pending'} />
              <Chip label={preview.status} />
              <Chip label={preview.location || 'Location pending'} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Caregiver</p>
              <p>{preview.caregiver || 'Not yet added'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Funding</p>
              <p>
                {preview.payer} · Services: {preview.serviceCodes.join(', ')}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Modalities</p>
              <p>{preview.modalities.join(', ') || '—'}</p>
              <p>
                Preferred days: {preview.preferredDays || '—'} · {preview.earliest}-{preview.latest}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );

  function renderStep() {
    switch (currentStep.id) {
      case 'profile':
        return (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">First name</span>
                <input
                  value={profile.firstName}
                  onChange={(event) => setProfile((prev) => ({ ...prev, firstName: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Last name</span>
                <input
                  value={profile.lastName}
                  onChange={(event) => setProfile((prev) => ({ ...prev, lastName: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Client ID</span>
                <input
                  value={profile.clientId}
                  onChange={(event) => setProfile((prev) => ({ ...prev, clientId: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Age</span>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(event) => setProfile((prev) => ({ ...prev, age: Number(event.target.value) }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
            </div>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Diagnosis</span>
              <input
                value={profile.diagnosis}
                onChange={(event) => setProfile((prev) => ({ ...prev, diagnosis: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                placeholder="Level 2 ASD, ADHD"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Primary location</span>
              <input
                value={profile.location}
                onChange={(event) => setProfile((prev) => ({ ...prev, location: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {['Active', 'Waitlist', 'Paused'].map((status) => (
                <button
                  type="button"
                  key={status}
                  onClick={() => setProfile((prev) => ({ ...prev, status }))}
                  className={cn(
                    'rounded-full border px-4 py-1 text-xs',
                    profile.status === status ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        );
      case 'caregivers':
        return (
          <div className="space-y-4">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Primary caregiver</span>
              <input
                value={caregivers.primaryName}
                onChange={(event) => setCaregivers((prev) => ({ ...prev, primaryName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Relationship</span>
                <select
                  value={caregivers.relationship}
                  onChange={(event) => setCaregivers((prev) => ({ ...prev, relationship: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                >
                  {['Parent', 'Guardian', 'Grandparent', 'Case manager'].map((relation) => (
                    <option key={relation}>{relation}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Preferred channel</span>
                <select
                  value={caregivers.preferredChannel}
                  onChange={(event) => setCaregivers((prev) => ({ ...prev, preferredChannel: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                >
                  {['SMS', 'Email', 'Phone call', 'Portal'].map((channel) => (
                    <option key={channel}>{channel}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</span>
                <input
                  value={caregivers.email}
                  onChange={(event) => setCaregivers((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Phone</span>
                <input
                  value={caregivers.phone}
                  onChange={(event) => setCaregivers((prev) => ({ ...prev, phone: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
            </div>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Secondary caregiver (optional)</span>
              <input
                value={caregivers.secondaryName}
                onChange={(event) => setCaregivers((prev) => ({ ...prev, secondaryName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                placeholder="Name"
              />
            </label>
            <input
              value={caregivers.secondaryEmail}
              onChange={(event) => setCaregivers((prev) => ({ ...prev, secondaryEmail: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2"
              placeholder="Email"
            />
          </div>
        );
      case 'funding':
        return (
          <div className="space-y-4">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Payer</span>
              <input
                value={funding.payer}
                onChange={(event) => setFunding((prev) => ({ ...prev, payer: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Authorization ID</span>
                <input
                  value={funding.authorizationId}
                  onChange={(event) => setFunding((prev) => ({ ...prev, authorizationId: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Hours authorized</span>
                <input
                  type="number"
                  value={funding.hoursAuthorized}
                  onChange={(event) => setFunding((prev) => ({ ...prev, hoursAuthorized: Number(event.target.value) }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Start date</span>
                <input
                  type="date"
                  value={funding.startDate}
                  onChange={(event) => setFunding((prev) => ({ ...prev, startDate: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">End date</span>
                <input
                  type="date"
                  value={funding.endDate}
                  onChange={(event) => setFunding((prev) => ({ ...prev, endDate: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Service codes</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['97153', '97155', '97156', '97151'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() =>
                      setFunding((prev) => ({
                        ...prev,
                        serviceCodes: prev.serviceCodes.includes(code)
                          ? prev.serviceCodes.filter((entry) => entry !== code)
                          : [...prev.serviceCodes, code]
                      }))
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs',
                      funding.serviceCodes.includes(code)
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-500'
                    )}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'constraints':
        return (
          <div className="space-y-4">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Care setting</span>
              <select
                value={constraints.careSetting}
                onChange={(event) => setConstraints((prev) => ({ ...prev, careSetting: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2"
              >
                {careSettings.map((setting) => (
                  <option key={setting}>{setting}</option>
                ))}
              </select>
            </label>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Modalities</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {modalityOptions.map((modality) => (
                  <button
                    key={modality}
                    type="button"
                    onClick={() =>
                      setConstraints((prev) => ({
                        ...prev,
                        modalities: prev.modalities.includes(modality)
                          ? prev.modalities.filter((entry) => entry !== modality)
                          : [...prev.modalities, modality]
                      }))
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs',
                      constraints.modalities.includes(modality)
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-500'
                    )}
                  >
                    {modality}
                  </button>
                ))}
              </div>
            </div>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Preferred days</span>
              <input
                value={constraints.preferredDays.join(', ')}
                onChange={(event) =>
                  setConstraints((prev) => ({
                    ...prev,
                    preferredDays: event.target.value.split(',').map((entry) => entry.trim()).filter(Boolean)
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                placeholder="Mon, Wed, Thu"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Earliest start</span>
                <input
                  type="time"
                  value={constraints.earliest}
                  onChange={(event) => setConstraints((prev) => ({ ...prev, earliest: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Latest end</span>
                <input
                  type="time"
                  value={constraints.latest}
                  onChange={(event) => setConstraints((prev) => ({ ...prev, latest: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
            </div>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Scheduling notes</span>
              <textarea
                value={constraints.notes}
                onChange={(event) => setConstraints((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                placeholder="Avoid overlapping with school drop-off. Needs Spanish speaking staff."
              />
            </label>
          </div>
        );
      case 'review':
        return (
          <div className="space-y-3 text-xs text-slate-600">
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Client</p>
              <p className="text-sm text-slate-900">
                {profile.firstName} {profile.lastName} · {profile.clientId}
              </p>
              <p>
                {profile.age} yrs · {profile.diagnosis || 'Diagnosis pending'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Caregivers</p>
              <p className="text-sm text-slate-900">{caregivers.primaryName || 'Primary contact pending'}</p>
              <p>{caregivers.email}</p>
              <p>
                Prefers {caregivers.preferredChannel} · {caregivers.phone || 'Phone pending'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Funding</p>
              <p className="text-sm text-slate-900">{funding.payer}</p>
              <p>
                Auth {funding.authorizationId || 'pending'} · {funding.hoursAuthorized} hrs from {funding.startDate || '—'} to{' '}
                {funding.endDate || '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Care settings</p>
              <p>
                {constraints.careSetting} · Modalities {constraints.modalities.join(', ') || '—'}
              </p>
              <p>
                Preferred {constraints.preferredDays.join(', ') || '—'} between {constraints.earliest}-{constraints.latest}
              </p>
              <p>{constraints.notes || 'No special instructions yet.'}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  }
}

function Chip({ label }: { label: string }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-[0.65rem] font-semibold text-slate-600">{label}</span>;
}
