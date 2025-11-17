'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type StaffCreatorProps = {
  open: boolean;
  onClose: () => void;
};

type StepId = 'basic' | 'roles' | 'locations' | 'availability' | 'preferences' | 'review';

const steps: { id: StepId; label: string; helper: string }[] = [
  { id: 'basic', label: 'Basic info', helper: 'Identify the clinician' },
  { id: 'roles', label: 'Roles & credentials', helper: 'Define billable scope' },
  { id: 'locations', label: 'Locations & travel', helper: 'Where they can work' },
  { id: 'availability', label: 'Availability', helper: 'Weekly pattern' },
  { id: 'preferences', label: 'Preferences & limits', helper: 'Soft constraints' },
  { id: 'review', label: 'Review & create', helper: 'Final confirmation' }
];

const languageOptions = ['English', 'Spanish', 'Hindi', 'ASL', 'Vietnamese'];
const roleOptions = ['RBT', 'BCBA', 'BCaBA', 'Psychologist', 'Scheduler', 'Admin'];
const serviceCatalog = [
  { code: '97153', label: 'Direct ABA therapy' },
  { code: '97155', label: 'Protocol modification' },
  { code: '97156', label: 'Parent guidance' },
  { code: '97151', label: 'Assessment' }
];
const travelRegions = ['North', 'South', 'East', 'West'];

type CredentialRow = {
  type: string;
  identifier: string;
  issuer: string;
  expiry: string;
};

const defaultAvailability = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => ({
  day,
  enabled: true,
  start: '09:00',
  end: '17:00'
}));

export function StaffCreator({ open, onClose }: StaffCreatorProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [basic, setBasic] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    staffId: '',
    email: '',
    phone: '',
    status: 'Active',
    languages: [] as string[]
  });
  const [roles, setRoles] = useState({
    primaryRole: 'RBT',
    additionalRoles: [] as string[],
    credentials: [{ type: '', identifier: '', issuer: '', expiry: '' }] as CredentialRow[],
    canSupervise: false,
    allowedServices: ['97153'],
    useRoleDefaults: true
  });
  const [locations, setLocations] = useState({
    type: 'Mixed',
    centers: [] as string[],
    regions: [] as string[],
    travelMode: 'Car',
    maxTravelMinutes: 30,
    prefersHome: true
  });
  const [availabilityMode, setAvailabilityMode] = useState<'default' | 'custom'>('default');
  const [availabilityBlocks, setAvailabilityBlocks] = useState(() => defaultAvailability.map((block) => ({ ...block })));
  const [preferences, setPreferences] = useState({
    maxHoursPerWeek: 30,
    noScheduleDays: [] as string[],
    preferredTimes: ['Mornings'],
    noSessionDays: [] as string[],
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const generatedId = `STF-${Math.floor(1000 + Math.random() * 9000)}`;
    setStepIndex(0);
    setBasic({
      firstName: '',
      lastName: '',
      displayName: '',
      staffId: generatedId,
      email: '',
      phone: '',
      status: 'Active',
      languages: ['English']
    });
    setRoles({
      primaryRole: 'RBT',
      additionalRoles: [],
      credentials: [{ type: 'RBT Certificate', identifier: '', issuer: '', expiry: '' }],
      canSupervise: false,
      allowedServices: ['97153'],
      useRoleDefaults: true
    });
    setLocations({
      type: 'Mixed',
      centers: ['Austin - North Center'],
      regions: ['North'],
      travelMode: 'Car',
      maxTravelMinutes: 30,
      prefersHome: true
    });
    setAvailabilityMode('default');
    setAvailabilityBlocks(defaultAvailability.map((block) => ({ ...block })));
    setPreferences({
      maxHoursPerWeek: 30,
      noScheduleDays: [],
      preferredTimes: ['Mornings'],
      noSessionDays: [],
      notes: ''
    });
    setSubmitting(false);
  }, [open]);

  useEffect(() => {
    setBasic((prev) => ({
      ...prev,
      displayName: `${prev.firstName} ${prev.lastName}`.trim()
    }));
  }, [basic.firstName, basic.lastName]);

  useEffect(() => {
    if (!roles.useRoleDefaults) return;
    if (roles.primaryRole === 'BCBA') {
      setRoles((prev) => ({ ...prev, allowedServices: ['97155', '97151', '97156'], canSupervise: true }));
    } else if (roles.primaryRole === 'RBT') {
      setRoles((prev) => ({ ...prev, allowedServices: ['97153'], canSupervise: false }));
    }
  }, [roles.primaryRole, roles.useRoleDefaults]);

  const preview = useMemo(() => {
    const weeklySummary =
      availabilityMode === 'default'
        ? 'Mon–Fri · 9a-5p (clinic default)'
        : availabilityBlocks
            .filter((block) => block.enabled)
            .map((block) => `${block.day} ${block.start}-${block.end}`)
            .join(', ');
    return {
      name: basic.displayName || 'New staff member',
      status: basic.status,
      role: roles.primaryRole,
      languages: basic.languages,
      services: roles.allowedServices,
      locations,
      availability: weeklySummary,
      maxHours: preferences.maxHoursPerWeek,
      preferences
    };
  }, [basic, roles, locations, availabilityMode, availabilityBlocks, preferences]);

  const currentStep = steps[stepIndex];
  const canProceed = (() => {
    if (currentStep.id === 'basic') {
      return Boolean(basic.firstName && basic.lastName && basic.email && basic.status);
    }
    if (currentStep.id === 'roles') {
      return Boolean(roles.primaryRole && roles.allowedServices.length);
    }
    if (currentStep.id === 'locations') {
      return (
        (locations.type === 'Telehealth-only' ? true : locations.centers.length > 0 || locations.regions.length > 0) &&
        Boolean(locations.travelMode)
      );
    }
    if (currentStep.id === 'availability') {
      return availabilityMode === 'default' || availabilityBlocks.some((block) => block.enabled);
    }
    if (currentStep.id === 'preferences') {
      return preferences.maxHoursPerWeek > 0;
    }
    return true;
  })();

  const handleSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onClose();
    }, 900);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-[1.7fr,1fr]">
        <section className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-2xl">
          <header className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Create staff</p>
              <h3 className="text-3xl font-semibold text-slate-900">New clinician profile</h3>
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
                    index === stepIndex ? 'border-slate-900 text-slate-900' : 'border-slate-200'
                  )}
                >
                  {index + 1}
                </span>
                <span className={cn(index === stepIndex ? 'text-slate-900' : '')}>{step.label}</span>
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
                className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold text-white disabled:opacity-40"
                disabled={submitting}
              >
                {submitting ? 'Creating…' : 'Create staff member'}
              </button>
            )}
            <span className="ml-auto text-xs text-slate-400">{currentStep.helper}</span>
          </footer>
        </section>
        <aside className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Preview</p>
          <h4 className="text-xl font-semibold text-slate-900">{preview.name}</h4>
          <div className="space-y-4 text-sm text-slate-600">
            <div className="flex flex-wrap gap-2 text-xs">
              <Chip label={preview.status} />
              <Chip label={preview.role} />
              <Chip label={`${preview.locations.type}`} />
              <Chip label={`${preview.maxHours}h/week cap`} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Languages</p>
              <p>{preview.languages.join(', ') || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Allowed services</p>
              <p>{preview.services.map((code) => `#${code}`).join(', ')}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Availability</p>
              <p>{preview.availability || 'Defaults pending'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Travel</p>
              <p>
                {preview.locations.travelMode} · {preview.locations.maxTravelMinutes} min gap · Regions:{' '}
                {preview.locations.regions.length ? preview.locations.regions.join(', ') : 'n/a'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Notes</p>
              <p>{preferences.notes || 'Add notes in Preferences step.'}</p>
            </div>
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
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">First name</span>
                <input
                  value={basic.firstName}
                  onChange={(event) => setBasic((prev) => ({ ...prev, firstName: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                  placeholder="Jordan"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Last name</span>
                <input
                  value={basic.lastName}
                  onChange={(event) => setBasic((prev) => ({ ...prev, lastName: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                  placeholder="Nguyen"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Display name</span>
                <input
                  value={basic.displayName}
                  onChange={(event) => setBasic((prev) => ({ ...prev, displayName: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Staff ID</span>
                <input
                  value={basic.staffId}
                  onChange={(event) => setBasic((prev) => ({ ...prev, staffId: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</span>
                <input
                  type="email"
                  value={basic.email}
                  onChange={(event) => setBasic((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                  placeholder="jordan.nguyen@continuumaba.com"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Phone</span>
                <input
                  value={basic.phone}
                  onChange={(event) => setBasic((prev) => ({ ...prev, phone: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                  placeholder="(512) 555-0199"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              {['Active', 'Onboarding', 'Inactive'].map((status) => (
                <button
                  type="button"
                  key={status}
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
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Languages</p>
              <div className="flex flex-wrap gap-2">
                {languageOptions.map((language) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() =>
                      setBasic((prev) => ({
                        ...prev,
                        languages: prev.languages.includes(language)
                          ? prev.languages.filter((entry) => entry !== language)
                          : [...prev.languages, language]
                      }))
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs',
                      basic.languages.includes(language)
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-500'
                    )}
                  >
                    {language}
                  </button>
                ))}
              </div>
              {basic.status === 'Active' && !basic.phone && (
                <p className="text-xs text-amber-600">Phone strongly recommended for Active staff.</p>
              )}
              {basic.status === 'Inactive' && (
                <p className="text-xs text-slate-500">
                  Inactive staff cannot be scheduled until activated. You can still finish setup.
                </p>
              )}
            </div>
          </div>
        );
      case 'roles':
        return (
          <div className="space-y-4">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Primary role</span>
              <select
                value={roles.primaryRole}
                onChange={(event) => setRoles((prev) => ({ ...prev, primaryRole: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2"
              >
                {roleOptions.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Additional roles</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {roleOptions.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() =>
                      setRoles((prev) => ({
                        ...prev,
                        additionalRoles: prev.additionalRoles.includes(role)
                          ? prev.additionalRoles.filter((entry) => entry !== role)
                          : [...prev.additionalRoles, role]
                      }))
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs',
                      roles.additionalRoles.includes(role)
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-500'
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={roles.useRoleDefaults}
                  onChange={() => setRoles((prev) => ({ ...prev, useRoleDefaults: !prev.useRoleDefaults }))}
                />
                Use default services for this role
              </label>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Allowed services</p>
              <div className="flex flex-wrap gap-2">
                {serviceCatalog.map((service) => (
                  <button
                    key={service.code}
                    type="button"
                    disabled={roles.useRoleDefaults}
                    onClick={() =>
                      setRoles((prev) => ({
                        ...prev,
                        allowedServices: prev.allowedServices.includes(service.code)
                          ? prev.allowedServices.filter((code) => code !== service.code)
                          : [...prev.allowedServices, service.code]
                      }))
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs',
                      roles.allowedServices.includes(service.code)
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-500',
                      roles.useRoleDefaults && 'opacity-40'
                    )}
                  >
                    {service.code} · {service.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Credentials</p>
                <button
                  type="button"
                  className="text-xs text-slate-500 underline"
                  onClick={() =>
                    setRoles((prev) => ({
                      ...prev,
                      credentials: [...prev.credentials, { type: '', identifier: '', issuer: '', expiry: '' }]
                    }))
                  }
                >
                  Add row
                </button>
              </div>
              {roles.credentials.map((credential, index) => (
                <div key={index} className="grid gap-2 md:grid-cols-2">
                  <input
                    value={credential.type}
                    onChange={(event) =>
                      updateCredential(index, { ...credential, type: event.target.value })
                    }
                    className="rounded-2xl border border-slate-200 px-3 py-2"
                    placeholder="Credential type"
                  />
                  <input
                    value={credential.identifier}
                    onChange={(event) =>
                      updateCredential(index, { ...credential, identifier: event.target.value })
                    }
                    className="rounded-2xl border border-slate-200 px-3 py-2"
                    placeholder="Credential ID"
                  />
                  <input
                    value={credential.issuer}
                    onChange={(event) =>
                      updateCredential(index, { ...credential, issuer: event.target.value })
                    }
                    className="rounded-2xl border border-slate-200 px-3 py-2"
                    placeholder="Issuing body"
                  />
                  <input
                    type="date"
                    value={credential.expiry}
                    onChange={(event) =>
                      updateCredential(index, { ...credential, expiry: event.target.value })
                    }
                    className="rounded-2xl border border-slate-200 px-3 py-2"
                  />
                </div>
              ))}
              {roles.canSupervise && roles.primaryRole !== 'BCBA' && (
                <p className="text-xs text-amber-600">Supervision enabled without BCBA credential.</p>
              )}
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={roles.canSupervise}
                  onChange={() => setRoles((prev) => ({ ...prev, canSupervise: !prev.canSupervise }))}
                />
                Can supervise
              </label>
            </div>
          </div>
        );
      case 'locations':
        return (
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Primary location type</p>
            <div className="flex flex-wrap gap-2">
              {['Center-based', 'Home-based', 'Mixed', 'Telehealth-only'].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setLocations((prev) => ({ ...prev, type }))}
                  className={cn(
                    'rounded-full border px-4 py-1 text-xs',
                    locations.type === type ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Centers</span>
              <input
                value={locations.centers.join(', ')}
                onChange={(event) =>
                  setLocations((prev) => ({ ...prev, centers: event.target.value.split(',').map((entry) => entry.trim()).filter(Boolean) }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                placeholder="Austin - North Center, Telehealth Hub"
              />
            </label>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Regions</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {travelRegions.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() =>
                      setLocations((prev) => ({
                        ...prev,
                        regions: prev.regions.includes(region)
                          ? prev.regions.filter((entry) => entry !== region)
                          : [...prev.regions, region]
                      }))
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs',
                      locations.regions.includes(region)
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-500'
                    )}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Travel mode</span>
                <select
                  value={locations.travelMode}
                  onChange={(event) => setLocations((prev) => ({ ...prev, travelMode: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                >
                  {['Car', 'Public transport', 'No travel'].map((mode) => (
                    <option key={mode}>{mode}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Max travel minutes</span>
                <input
                  type="number"
                  value={locations.maxTravelMinutes}
                  onChange={(event) => setLocations((prev) => ({ ...prev, maxTravelMinutes: Number(event.target.value) }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={locations.prefersHome}
                onChange={() => setLocations((prev) => ({ ...prev, prefersHome: !prev.prefersHome }))}
              />
              Prefers home visits
            </label>
            {locations.type !== 'Telehealth-only' && locations.centers.length === 0 && locations.regions.length === 0 && (
              <p className="text-xs text-rose-500">Select at least one center or region for non-telehealth staff.</p>
            )}
            {locations.travelMode === 'No travel' && locations.type === 'Home-based' && (
              <p className="text-xs text-amber-600">Home-based staff typically require travel. Confirm this setting.</p>
            )}
          </div>
        );
      case 'availability':
        return (
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Weekly template</p>
            <div className="flex flex-wrap gap-2">
              {['default', 'custom'].map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setAvailabilityMode(mode as typeof availabilityMode)}
                  className={cn(
                    'rounded-full border px-4 py-1 text-xs capitalize',
                    availabilityMode === mode ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
            {availabilityMode === 'default' ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-4 text-xs text-slate-600">
                Using clinic default: Mon–Fri · 9:00a – 5:00p. Switch to custom to edit per day.
              </div>
            ) : (
              <div className="space-y-3">
                {availabilityBlocks.map((block, index) => (
                  <div key={block.day} className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleAvailability(index)}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        block.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {block.day}
                    </button>
                    <input
                      type="time"
                      value={block.start}
                      onChange={(event) => updateAvailability(index, { ...block, start: event.target.value })}
                      className="rounded-2xl border border-slate-200 px-3 py-1 text-xs"
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={block.end}
                      onChange={(event) => updateAvailability(index, { ...block, end: event.target.value })}
                      className="rounded-2xl border border-slate-200 px-3 py-1 text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'preferences':
        return (
          <div className="space-y-4">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Max hours per week</span>
              <input
                type="number"
                value={preferences.maxHoursPerWeek}
                onChange={(event) => setPreferences((prev) => ({ ...prev, maxHoursPerWeek: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2"
              />
            </label>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">No-schedule days</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setPreferences((prev) => ({
                        ...prev,
                        noScheduleDays: prev.noScheduleDays.includes(day)
                          ? prev.noScheduleDays.filter((entry) => entry !== day)
                          : [...prev.noScheduleDays, day]
                      }))
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs',
                      preferences.noScheduleDays.includes(day)
                        ? 'border-rose-300 bg-rose-50 text-rose-600'
                        : 'border-slate-200 text-slate-500'
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Preferred time of day</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Mornings', 'Afternoons', 'Evenings'].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() =>
                      setPreferences((prev) => ({
                        ...prev,
                        preferredTimes: prev.preferredTimes.includes(time)
                          ? prev.preferredTimes.filter((entry) => entry !== time)
                          : [...prev.preferredTimes, time]
                      }))
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs',
                      preferences.preferredTimes.includes(time)
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-500'
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Notes to schedulers</span>
              <textarea
                value={preferences.notes}
                onChange={(event) => setPreferences((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2"
                placeholder="Prefers block scheduling and 30 min travel cushions."
              />
            </label>
          </div>
        );
      case 'review':
        return (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Confirm everything looks right before creating this staff member.</p>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-xs text-slate-600">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Identity</p>
              <p className="text-sm text-slate-900">
                {basic.displayName} ({basic.staffId})
              </p>
              <p>{basic.email}</p>
              <p>{basic.phone || 'Phone pending'}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-xs text-slate-600">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Roles & services</p>
              <p className="text-sm text-slate-900">
                {roles.primaryRole} {roles.canSupervise ? '· Can supervise' : ''}
              </p>
              <p>Services: {roles.allowedServices.join(', ')}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-xs text-slate-600">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Coverage</p>
              <p>
                Type: {locations.type} · Centers: {locations.centers.join(', ') || '—'} · Regions:{' '}
                {locations.regions.join(', ') || '—'}
              </p>
              <p>
                Travel: {locations.travelMode} ({locations.maxTravelMinutes} min) · Prefers home visits:{' '}
                {locations.prefersHome ? 'Yes' : 'No'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-xs text-slate-600">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Availability & preferences</p>
              <p>Mode: {availabilityMode === 'default' ? 'Clinic default' : 'Custom'}</p>
              <p>Max hours/week: {preferences.maxHoursPerWeek}</p>
              <p>No-schedule days: {preferences.noScheduleDays.join(', ') || '—'}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  function updateCredential(index: number, credential: CredentialRow) {
    setRoles((prev) => {
      const next = [...prev.credentials];
      next[index] = credential;
      return { ...prev, credentials: next };
    });
  }

  function updateAvailability(index: number, block: (typeof availabilityBlocks)[number]) {
    setAvailabilityBlocks((prev) => prev.map((entry, idx) => (idx === index ? block : entry)));
  }

  function toggleAvailability(index: number) {
    setAvailabilityBlocks((prev) =>
      prev.map((entry, idx) => (idx === index ? { ...entry, enabled: !entry.enabled } : entry))
    );
  }
}

function Chip({ label }: { label: string }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-[0.65rem] font-semibold text-slate-600">{label}</span>;
}
