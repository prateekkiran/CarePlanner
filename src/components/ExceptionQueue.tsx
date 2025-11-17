import { Appointment } from '@/lib/types';
import { formatTimestamp } from '@/lib/date';

interface ExceptionQueueProps {
  appointments: Appointment[];
}

export function ExceptionQueue({ appointments }: ExceptionQueueProps) {
  const exceptions = appointments.flatMap((appointment) =>
    appointment.validations
      .filter((validation) => validation.status !== 'pass')
      .map((validation) => ({ appointment, validation }))
  );

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Exception queue</p>
          <h3 className="text-lg font-semibold text-slate-900">{exceptions.length} blockers</h3>
        </div>
        <button className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600">Export</button>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        {exceptions.length === 0 && <p className="text-slate-500">All clear! No validation blockers.</p>}
        {exceptions.map(({ appointment, validation }) => (
          <article key={`${appointment.id}-${validation.id}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">{appointment.title}</p>
              <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs uppercase text-slate-600">
                {validation.status}
              </span>
            </div>
            <p className="text-slate-600">{validation.label}</p>
            <p className="text-slate-500">{validation.description}</p>
            <p className="text-xs text-slate-400">{formatTimestamp(appointment.scheduledStart)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
