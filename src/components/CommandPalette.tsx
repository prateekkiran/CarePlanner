"use client";

import { useEffect, useMemo, useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk";
import clsx from "clsx";

type PaletteEntry = {
  id: string;
  label: string;
  meta?: string;
  type: "Client" | "Staff" | "Page" | "Action";
  target?: string;
};

export function CommandPalette({
  onClose,
  items,
  onSelectPage
}: {
  onClose: () => void;
  items: { clients: PaletteEntry[]; staff: PaletteEntry[]; pages: PaletteEntry[] };
  onSelectPage: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = useMemo(() => {
    const normalize = (value: string) => value.toLowerCase();
    const q = normalize(query);
    const filterItems = (entries: PaletteEntry[]) =>
      entries.filter((entry) => normalize(entry.label).includes(q) || normalize(entry.meta ?? "").includes(q));
    return {
      clients: filterItems(items.clients),
      staff: filterItems(items.staff),
      pages: filterItems(items.pages)
    };
  }, [items, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 px-4 py-10">
      <Command className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <CommandInput value={query} onValueChange={setQuery} placeholder="Search clients, staff, sessions, or pages" />
        <CommandList className="max-h-[60vh] overflow-y-auto">
          <CommandEmpty className="p-4 text-sm text-slate-500">
            No matches. Try another spelling or create a new record.
          </CommandEmpty>
          <CommandGroup heading="Clients">
            {filtered.clients.map((entry) => (
              <Item key={entry.id} entry={entry} onSelect={() => onClose()} />
            ))}
          </CommandGroup>
          <CommandGroup heading="Staff">
            {filtered.staff.map((entry) => (
              <Item key={entry.id} entry={entry} onSelect={() => onClose()} />
            ))}
          </CommandGroup>
          <CommandGroup heading="Pages">
            {filtered.pages.map((entry) => (
              <Item
                key={entry.id}
                entry={entry}
                onSelect={() => {
                  if (entry.target) onSelectPage(entry.target);
                  onClose();
                }}
              />
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}

function Item({ entry, onSelect }: { entry: PaletteEntry; onSelect: () => void }) {
  return (
    <CommandItem
      value={entry.id}
      onSelect={onSelect}
      className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-slate-800"
    >
      <span className="flex items-center gap-2">
        <span className={clsx("rounded-full px-2 py-0.5 text-xs", badgeColor(entry.type))}>{entry.type}</span>
        <span className="font-medium">{entry.label}</span>
      </span>
      {entry.meta && <span className="text-xs text-slate-500">{entry.meta}</span>}
    </CommandItem>
  );
}

function badgeColor(type: PaletteEntry["type"]) {
  switch (type) {
    case "Client":
      return "bg-indigo-50 text-indigo-700";
    case "Staff":
      return "bg-emerald-50 text-emerald-700";
    case "Page":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

