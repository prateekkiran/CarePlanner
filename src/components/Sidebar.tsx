const links = ['Control tower', 'Scheduler', 'Clients', 'Staff', 'Rooms & resources', 'Analytics'];

interface SidebarProps {
  active: string;
  onSelect: (link: string) => void;
}

export function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <aside className="hidden min-h-screen flex-col gap-6 border-r border-slate-100 bg-white/80 p-6 text-slate-700 shadow-sm backdrop-blur lg:flex">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Continuum</p>
        <h1 className="text-2xl font-semibold text-slate-900">Scheduling OS</h1>
        <p className="text-sm text-slate-500">Spring 24 · Aurora build</p>
      </div>
      <nav className="flex flex-col gap-2 text-sm">
        {links.map((link) => (
          <button
            key={link}
            type="button"
            onClick={() => onSelect(link)}
            className={`rounded-xl border px-4 py-2 text-left transition ${
              link === active
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-transparent bg-slate-50 text-slate-600 hover:border-slate-200'
            }`}
          >
            {link}
          </button>
        ))}
      </nav>
      <div className="mt-auto space-y-2 text-xs text-slate-500">
        <p>Upcoming release:</p>
        <p className="text-slate-800">Autofill waitlist + EVV geofencing alerts</p>
      </div>
    </aside>
  );
}
