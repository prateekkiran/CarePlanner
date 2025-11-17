'use client';

import { PersonaView } from '@/lib/types';

interface PersonaSwitcherProps {
  personas: PersonaView[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function PersonaSwitcher({ personas, activeId, onSelect }: PersonaSwitcherProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {personas.map((persona) => (
        <button
          key={persona.id}
          type="button"
          onClick={() => onSelect(persona.id)}
          className={`rounded-2xl border px-5 py-4 text-left transition ${
            persona.id === activeId
              ? 'border-emerald-200 bg-white text-slate-900 shadow-lg'
              : 'border-slate-100 bg-white/70 text-slate-600 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Persona</p>
              <h3 className="text-xl font-semibold text-slate-900">{persona.label}</h3>
            </div>
            <span className="text-xs text-slate-400">{persona.focus[0]}</span>
          </div>
          <p className="mt-2 text-sm text-slate-500">{persona.description}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {persona.metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-slate-100 bg-white p-3">
                <p className="text-2xl font-semibold text-slate-900">{metric.value}</p>
                <p className="text-xs uppercase tracking-wide text-slate-400">{metric.label}</p>
                {metric.trend && <p className="text-xs text-emerald-500">{metric.trend}</p>}
              </div>
            ))}
          </div>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-500">
            {persona.focus.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </button>
      ))}
    </section>
  );
}
