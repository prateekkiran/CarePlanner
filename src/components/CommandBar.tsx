'use client';

const locations = ['All campuses', 'Austin - North', 'In-home', 'Telehealth'];
const modalities: Array<'Center' | 'Home' | 'School' | 'Telehealth'> = ['Center', 'Home', 'School', 'Telehealth'];

interface CommandBarProps {
  location: string;
  onLocationChange: (value: string) => void;
  modality: 'Center' | 'Home' | 'School' | 'Telehealth';
  onModalityChange: (value: 'Center' | 'Home' | 'School' | 'Telehealth') => void;
}

export function CommandBar({ location, onLocationChange, modality, onModalityChange }: CommandBarProps) {
  return (
    <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-white/80 px-5 py-4 text-sm text-slate-600 shadow-sm">
      <label className="space-y-1">
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Location</span>
        <select
          className="rounded-xl border border-slate-200 bg-white px-4 py-2"
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
        >
          {locations.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Modality</span>
        <div className="flex flex-wrap gap-2">
          {modalities.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onModalityChange(option)}
            className={`rounded-full border px-4 py-2 ${
                modality === option ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">EVV</span>
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300" />
          <span>Show EVV required</span>
        </label>
      </div>
      <button type="button" className="ml-auto rounded-full border border-slate-200 px-4 py-2 text-slate-600">
        Advanced filters
      </button>
    </section>
  );
}
