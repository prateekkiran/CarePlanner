import { WaitlistEntry } from '@/lib/types';

interface WaitlistPanelProps {
  entries: WaitlistEntry[];
}

export function WaitlistPanel({ entries }: WaitlistPanelProps) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Waitlist intelligence</p>
          <h3 className="text-lg font-semibold text-slate-900">{entries.length} families awaiting placement</h3>
        </div>
        <button className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600">Suggest matches</button>
      </div>
      <div className="mt-4 space-y-4">
        {entries.map((entry) => (
          <article key={entry.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
            <header className="flex items-start justify-between">
              <div>
                <p className="text-base font-semibold text-slate-900">{entry.client}</p>
                <p className="text-slate-500">
                  {entry.age} yrs · {entry.diagnosis}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  entry.priority === 'High'
                    ? 'bg-red-50 text-red-600'
                    : entry.priority === 'Medium'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-blue-50 text-blue-600'
                }`}
              >
                {entry.priority}
              </span>
            </header>
            <div className="mt-3 grid gap-2 md:grid-cols-2 text-slate-600">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Location</p>
                <p>{entry.location}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Windows</p>
                <p>{entry.preferredWindows}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Service</p>
                <p>{entry.requestedService}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Staff</p>
                <p>{entry.staffPreferences}</p>
              </div>
            </div>
            <p className="mt-3 text-slate-500">{entry.notes}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="rounded-full bg-emerald-400 px-3 py-1 text-sm font-semibold text-slate-900">Place block</button>
              <button className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600">Message caregiver</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
