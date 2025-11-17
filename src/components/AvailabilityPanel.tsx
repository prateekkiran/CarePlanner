import { AvailabilityItem } from '@/lib/types';

interface AvailabilityPanelProps {
  items: AvailabilityItem[];
}

export function AvailabilityPanel({ items }: AvailabilityPanelProps) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Staff availability</p>
      <h3 className="text-lg font-semibold text-slate-900">Load vs target hours</h3>
      <div className="mt-4 space-y-4 text-sm">
        {items.map((item) => {
          const pct = Math.round((item.load / item.target) * 100);
          return (
            <div key={item.staffId} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900 font-semibold">{item.staffName}</p>
                  <p className="text-slate-500">
                    {item.credential} · {item.location}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{item.travelBuffer} travel buffer</span>
              </div>
              <div className="mt-3">
                <div className="h-2 rounded-full bg-white">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {item.load} / {item.target} hrs ({pct}%) · EVV {item.evvRequired ? 'required' : 'optional'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
