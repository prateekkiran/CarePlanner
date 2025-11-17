'use client';

import { useMemo, useState } from 'react';
import { schedulerSnapshot } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { StaffCreator } from './StaffCreator';

type CredentialFilter = 'All' | 'BCBA' | 'RBT' | 'Other';

type EnrichedStaff = {
  id: string;
  name: string;
  credential: string;
  primaryLocation: string;
  email: string;
  phone: string;
  load: number;
  target: number;
  ratio: number;
  travelBuffer?: string;
  evvRequired?: boolean;
  status: 'Healthy' | 'Tight' | 'Over capacity';
};

const credentialFilters: CredentialFilter[] = ['All', 'BCBA', 'RBT', 'Other'];
const pageSizeOptions = [20, 50, 100] as const;
const sortOptions = [
  { id: 'NAME_ASC', label: 'Name (A–Z)' },
  { id: 'LOAD_DESC', label: 'Load (High → Low)' },
  { id: 'LOAD_ASC', label: 'Load (Low → High)' }
] as const;

export function StaffWorkspace() {
  const staffProfiles = schedulerSnapshot.staff;
  const availability = schedulerSnapshot.availability;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CredentialFilter>('All');
  const [selectedId, setSelectedId] = useState(staffProfiles[0]?.id);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(pageSizeOptions[0]);
  const [sort, setSort] = useState<(typeof sortOptions)[number]['id']>('NAME_ASC');
  const [creatorOpen, setCreatorOpen] = useState(false);

  const enrichedStaff = useMemo<EnrichedStaff[]>(() => {
    return staffProfiles.map((profile, index) => {
      const availabilityEntry = availability.find((entry) => entry.staffName === profile.name);
      const load = availabilityEntry?.load ?? 0;
      const target = availabilityEntry?.target ?? 32;
      const ratio = load / target;
      const status: EnrichedStaff['status'] = ratio > 1 ? 'Over capacity' : ratio > 0.8 ? 'Tight' : 'Healthy';
      const base = profile.name.split(',')[0] ?? profile.name;
      const email = `${base.replace(/[^a-zA-Z]/g, '.').replace(/\.+/g, '.').toLowerCase()}@continuumaba.com`;
      const phone = `(512) 555-${(6200 + index * 7).toString().padStart(4, '0')}`;

      return {
        id: profile.id,
        name: profile.name,
        credential: profile.credential,
        primaryLocation: profile.primaryLocation,
        email,
        phone,
        load,
        target,
        ratio,
        travelBuffer: availabilityEntry?.travelBuffer,
        evvRequired: availabilityEntry?.evvRequired,
        status
      };
    });
  }, [staffProfiles, availability]);

  const metrics = useMemo(() => {
    const total = enrichedStaff.length;
    const bcbaCount = enrichedStaff.filter((staff) => staff.credential === 'BCBA').length;
    const rbtCount = enrichedStaff.filter((staff) => staff.credential === 'RBT').length;
    const overCapacity = enrichedStaff.filter((staff) => staff.status === 'Over capacity').length;
    const averageLoad =
      enrichedStaff.reduce((acc, staff) => acc + staff.ratio, 0) / (enrichedStaff.length || 1);
    return { total, bcbaCount, rbtCount, overCapacity, averageLoad: Math.round(averageLoad * 100) };
  }, [enrichedStaff]);

  const filteredStaff = useMemo(() => {
    const filtered = enrichedStaff.filter((staff) => {
      const matchesSearch =
        staff.name.toLowerCase().includes(search.toLowerCase()) ||
        staff.primaryLocation.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === 'All'
          ? true
          : filter === 'Other'
            ? !['BCBA', 'RBT'].includes(staff.credential)
            : staff.credential === filter;
      return matchesSearch && matchesFilter;
    });
    return filtered.sort((a, b) => {
      if (sort === 'NAME_ASC') return a.name.localeCompare(b.name);
      if (sort === 'LOAD_DESC') return b.ratio - a.ratio;
      if (sort === 'LOAD_ASC') return a.ratio - b.ratio;
      return 0;
    });
  }, [enrichedStaff, search, filter, sort]);

  const totalItems = filteredStaff.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);
  const paginatedStaff = filteredStaff.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const effectiveSelectedId = filteredStaff.some((staff) => staff.id === selectedId)
    ? selectedId
    : filteredStaff[0]?.id ?? enrichedStaff[0]?.id;
  const selectedStaff =
    filteredStaff.find((staff) => staff.id === effectiveSelectedId) ?? filteredStaff[0] ?? enrichedStaff[0];
  const caseload = useMemo(() => {
    if (!selectedStaff) return [];
    return schedulerSnapshot.clients.filter(
      (client) => client.bcba === selectedStaff.name || client.rbt === selectedStaff.name
    );
  }, [selectedStaff]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Staff</p>
          <h2 className="text-3xl font-semibold text-slate-900">Staffing intelligence cockpit</h2>
          <p className="text-sm text-slate-500">
            Balance credential mix, availability, travel expectations, and wellbeing signals before assigning cases.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreatorOpen(true)}
          className="ml-auto rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white"
        >
          + Add staff
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total clinicians" value={metrics.total.toString()} helper="+6 vs last month" />
        <MetricCard label="BCBAs" value={metrics.bcbaCount.toString()} helper="Clinical leads" />
        <MetricCard label="RBTs" value={metrics.rbtCount.toString()} helper="Direct therapists" />
        <MetricCard
          label="Avg. load"
          value={`${metrics.averageLoad}%`}
          helper={metrics.overCapacity ? `${metrics.overCapacity} flagged` : 'All within target'}
          highlight={metrics.overCapacity > 0}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.7fr,1fr]">
        <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Roster snapshot</h3>
            <div className="ml-auto flex items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by name or location"
                  className="w-56 bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                {credentialFilters.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setFilter(option);
                      setPage(1);
                    }}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-xs font-medium transition',
                      filter === option
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-1">
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as (typeof sortOptions)[number]['id']);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs font-medium text-slate-600 focus:outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-auto rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Clinician</th>
                  <th className="px-4 py-3 font-medium">Credential</th>
                  <th className="px-4 py-3 font-medium">Load</th>
                  <th className="px-4 py-3 font-medium">Travel</th>
                  <th className="px-4 py-3 font-medium">EVV</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedStaff.map((staff) => (
                  <tr
                    key={staff.id}
                    className={cn(
                      'cursor-pointer bg-white transition hover:bg-slate-50',
                      effectiveSelectedId === staff.id && 'bg-emerald-50/60'
                    )}
                    onClick={() => setSelectedId(staff.id)}
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{staff.name}</p>
                        <p className="text-xs text-slate-500">{staff.primaryLocation}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{staff.credential}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-slate-100">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              staff.status === 'Over capacity'
                                ? 'bg-rose-400'
                                : staff.status === 'Tight'
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                            )}
                            style={{ width: `${Math.min(staff.ratio * 100, 110)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {staff.load}/{staff.target}h
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">{staff.travelBuffer ?? '—'}</td>
                    <td className="px-4 py-4 text-xs">
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-xs',
                          staff.evvRequired ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        {staff.evvRequired ? 'Required' : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium',
                          staff.status === 'Over capacity'
                            ? 'bg-rose-100 text-rose-700'
                            : staff.status === 'Tight'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                        )}
                      >
                        {staff.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={6}>
                      No staff match this search yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationFooter
            entityLabel="staff"
            page={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
          />
        </div>

        <aside className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          {selectedStaff ? (
            <>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-200 to-sky-200 text-lg font-semibold text-slate-800">
                    {selectedStaff.name
                      .split(' ')
                      .slice(0, 2)
                      .map((chunk) => chunk.charAt(0))
                      .join('')}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{selectedStaff.name}</p>
                    <p className="text-sm text-slate-500">
                      {selectedStaff.credential} · {selectedStaff.primaryLocation}
                    </p>
                  </div>
                </div>
                <button className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">Message</button>
              </div>
              <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
                <p>
                  Email:{' '}
                  <a href={`mailto:${selectedStaff.email}`} className="text-slate-900 underline">
                    {selectedStaff.email}
                  </a>
                </p>
                <p>Phone: {selectedStaff.phone}</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <Chip label={`${Math.round(selectedStaff.ratio * 100)}% load`} intent="primary" />
                  <Chip label={selectedStaff.status} intent={selectedStaff.status === 'Over capacity' ? 'danger' : 'neutral'} />
                  {selectedStaff.travelBuffer && <Chip label={`Travel ${selectedStaff.travelBuffer}`} intent="neutral" />}
                </div>
              </div>
              <section className="space-y-2">
                <header className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Assigned caseload</p>
                    <p className="text-xs text-slate-500">Treatment hours delivered vs prescribed</p>
                  </div>
                  <span className="text-xs text-slate-400">{caseload.length} clients</span>
                </header>
                <div className="space-y-3">
                  {caseload.slice(0, 4).map((client) => (
                    <div key={client.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{client.name}</p>
                      <p className="text-xs text-slate-500">
                        {client.hoursDelivered}/{client.hoursPrescribed} hrs · {client.status}
                      </p>
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${(client.hoursDelivered / client.hoursPrescribed) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {caseload.length === 0 && (
                    <p className="rounded-2xl border border-slate-100 px-4 py-3 text-xs text-slate-500">
                      No active clients assigned.
                    </p>
                  )}
                </div>
              </section>
              <section className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">Next actions</p>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                    Confirm supervision overlap with BCBA lead · due tomorrow
                  </li>
                  <li className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                    Update EVV caregiver PIN for Thursday in-home visit
                  </li>
                  <li className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                    Align with caregiver on telehealth slot change
                  </li>
                </ul>
              </section>
            </>
          ) : (
            <p className="text-sm text-slate-500">Select a clinician to see details.</p>
          )}
        </aside>
      </div>
      <StaffCreator open={creatorOpen} onClose={() => setCreatorOpen(false)} />
    </section>
  );
}

function MetricCard({ label, value, helper, highlight }: { label: string; value: string; helper: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-100 bg-white p-4 shadow-sm',
        highlight && 'border-rose-200 bg-rose-50/70'
      )}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <p className={cn('text-xs', highlight ? 'text-rose-600' : 'text-slate-500')}>{helper}</p>
    </div>
  );
}

function Chip({ label, intent }: { label: string; intent?: 'primary' | 'danger' | 'neutral' }) {
  if (intent === 'danger') {
    return <span className="rounded-full bg-rose-100 px-3 py-1 text-[0.65rem] font-semibold text-rose-700">{label}</span>;
  }
  if (intent === 'primary') {
    return <span className="rounded-full bg-emerald-100 px-3 py-1 text-[0.65rem] font-semibold text-emerald-700">{label}</span>;
  }
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-[0.65rem] font-semibold text-slate-500">{label}</span>;
}

function PaginationFooter({
  entityLabel,
  page,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  pageSize,
  onPageChange,
  onPageSizeChange
}: {
  entityLabel: string;
  page: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: (typeof pageSizeOptions)[number]) => void;
}) {
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
      <p className="text-sm">
        Showing {startIndex}-{endIndex} of {totalItems} {entityLabel}
      </p>
      <div className="ml-auto flex items-center gap-2">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value) as (typeof pageSizeOptions)[number])}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-full border border-slate-200 px-3 py-1 disabled:opacity-40"
        >
          Prev
        </button>
        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={cn(
              'rounded-full px-3 py-1',
              pageNumber === page ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600'
            )}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded-full border border-slate-200 px-3 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
