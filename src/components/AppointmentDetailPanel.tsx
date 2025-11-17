'use client';

import { Appointment, AuthorizationSummary } from '@/lib/types';
import { formatRange, formatShortDate } from '@/lib/date';

interface AppointmentDetailPanelProps {
  appointment?: Appointment;
  authorizations: Record<string, AuthorizationSummary>;
  onReschedule: (appointment: Appointment) => void;
}

export function AppointmentDetailPanel({ appointment, authorizations, onReschedule }: AppointmentDetailPanelProps) {
  if (!appointment) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-slate-500">
        Select a block on the grid to review details, authorizations, and validations.
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 space-y-4 shadow-sm">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Appointment Detail</p>
          <h3 className="text-2xl font-semibold text-slate-900">{appointment.title}</h3>
          <p className="text-sm text-slate-500">{appointment.location}</p>
        </div>
        <span className="rounded-full border border-slate-200 px-4 py-1 text-xs text-slate-600 bg-slate-50">{appointment.status}</span>
      </header>
      <div className="grid gap-4 sm:grid-cols-3 text-sm text-slate-600">
        <div>
          <p className="text-slate-400">Window</p>
          <p>{formatRange(appointment.scheduledStart, appointment.scheduledEnd)}</p>
        </div>
        <div>
          <p className="text-slate-400">Service</p>
          <p>
            {appointment.serviceCode} · {appointment.modality}
          </p>
        </div>
        <div>
          <p className="text-slate-400">EVV</p>
          <p>{appointment.evvRequired ? 'Required' : 'Optional'}</p>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Participants</p>
        <ul className="space-y-2 text-sm text-slate-600">
          {appointment.participants.map((participant) => (
            <li key={participant.id} className="flex items-center justify-between">
              <span>{participant.name}</span>
              <span className="text-slate-400">{participant.role}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Authorizations</p>
        {appointment.participants
          .filter((participant) => participant.type === 'Client')
          .map((participant) => {
            const auth = authorizations[participant.id];
            return (
              <div key={participant.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                <p className="font-semibold text-slate-900">{participant.name}</p>
                {auth ? (
                  <div className="flex flex-wrap gap-4 text-slate-500">
                    <span>{auth.payer}</span>
                    <span>{auth.remainingMinutes} min remaining</span>
                    <span>Expires {formatShortDate(auth.expiresOn)}</span>
                  </div>
                ) : (
                  <p className="text-orange-500">No active authorization on file.</p>
                )}
              </div>
            );
          })}
      </div>
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Validation flags</p>
        <ul className="space-y-2">
          {appointment.validations.map((validation) => (
            <li
              key={validation.id}
              className={`rounded-2xl border px-4 py-2 text-sm ${
                validation.status === 'fail'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : validation.status === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              <p className="font-semibold">{validation.label}</p>
              <p>{validation.description}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900" type="button">
          Advance lifecycle
        </button>
        <button className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600" type="button" onClick={() => onReschedule(appointment)}>
          Reschedule
        </button>
      </div>
    </section>
  );
}
