"use client";

import { useEffect, useMemo, useState } from "react";
import { Menu as MenuIcon, Search, UserCircle2 } from "lucide-react";
import clsx from "clsx";
import { CommandPalette } from "./CommandPalette";
import { schedulerSnapshot } from "@/lib/mockData";

type NavItem = {
  id: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home" },
  { id: "schedule", label: "Schedule" },
  { id: "clients", label: "Clients" },
  { id: "staff", label: "Staff" },
  { id: "rooms", label: "Rooms & Resources" },
  { id: "intake", label: "Intake & Waitlist" },
  { id: "analytics", label: "Analytics" },
  { id: "settings", label: "Settings" }
];

type AppShellProps = {
  active: string;
  onNavigate: (id: string) => void;
  children: React.ReactNode;
  dateLabel?: string;
  onPrevDate?: () => void;
  onNextDate?: () => void;
  onToday?: () => void;
};

export function AppShell({ active, onNavigate, children, dateLabel, onPrevDate, onNextDate, onToday }: AppShellProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [location, setLocation] = useState("All locations");

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const paletteItems = useMemo(() => {
    const clients = schedulerSnapshot.clients.map((client) => ({
      id: client.id,
      label: client.name,
      meta: client.status,
      type: "Client"
    }));
    const staff = schedulerSnapshot.staff.map((member) => ({
      id: member.id,
      label: member.name,
      meta: member.credential,
      type: "Staff"
    }));
    const pages = NAV_ITEMS.map((item) => ({
      id: `page-${item.id}`,
      label: item.label,
      meta: "Page",
      type: "Page",
      target: item.id
    }));
    return { clients, staff, pages };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white/80 backdrop-blur lg:flex">
          <div className="flex items-center gap-2 px-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 font-semibold">
              CP
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">CarePlanner OS</p>
              <p className="text-xs text-slate-500">Scheduling Control Tower</p>
            </div>
          </div>
          <nav className="mt-2 flex flex-1 flex-col gap-1 px-2 pb-4">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={clsx(
                  "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition",
                  active === item.id
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {item.label}
                {active === item.id && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
              </button>
            ))}
          </nav>
          <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">v0.4 Scheduler OS</div>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur">
            <button className="lg:hidden rounded-full border border-slate-200 p-2 text-slate-600" aria-label="Open navigation">
              <MenuIcon className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Location</span>
              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="bg-transparent text-sm font-medium text-slate-800 focus:outline-none"
              >
                <option>All locations</option>
                <option>Center A</option>
                <option>Center B</option>
              </select>
            </div>
            {dateLabel && (
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 shadow-sm">
                <button
                  type="button"
                  onClick={onPrevDate}
                  className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-100"
                  aria-label="Previous period"
                >
                  ‹
                </button>
                <span className="px-2 font-semibold text-slate-900">{dateLabel}</span>
                <button
                  type="button"
                  onClick={onNextDate}
                  className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-100"
                  aria-label="Next period"
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={onToday}
                  className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Today
                </button>
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm hover:border-slate-300"
              >
                <Search className="h-4 w-4" />
                <span>Search (⌘/Ctrl + K)</span>
              </button>
              <button className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 shadow-sm">Today</button>
              <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 shadow-sm">
                <UserCircle2 className="h-5 w-5" />
                <span>Priya</span>
              </button>
            </div>
          </header>

          <div className="px-4 py-6 lg:px-10">{children}</div>
        </main>
      </div>

      {commandOpen && (
        <CommandPalette
          onClose={() => setCommandOpen(false)}
          items={paletteItems}
          onSelectPage={(id) => {
            onNavigate(id);
            setCommandOpen(false);
          }}
        />
      )}
    </div>
  );
}
