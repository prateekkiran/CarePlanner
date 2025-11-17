'use client';

import { useMemo, useState } from 'react';
import { schedulerSnapshot } from '@/lib/mockData';
import type { ClientRecord } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ClientCreator } from './ClientCreator';

type StatusFilter = 'All' | ClientRecord['status'];

const statusFilters: StatusFilter[] = ['All', 'Active', 'Waitlist', 'Paused'];
const pageSizeOptions = [20, 50, 100] as const;
const sortOptions = [
  { id: 'NAME_ASC', label: 'Name (A–Z)' },
  { id: 'AGE_ASC', label: 'Age (youngest)' },
  { id: 'AGE_DESC', label: 'Age (oldest)' },
  { id: 'COVERAGE_ASC', label: 'Coverage (low → high)' },
  { id: 'COVERAGE_DESC', label: 'Coverage (high → low)' }
] as const;

const statusClasses: Record<ClientRecord['status'], string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Waitlist: 'bg-amber-100 text-amber-700',
  Paused: 'bg-slate-100 text-slate-500'
};

export function ClientsWorkspace() {
  const clients = schedulerSnapshot.clients;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [selectedId, setSelectedId] = useState(clients[0]?.id);
  const [sort, setSort] = useState<(typeof sortOptions)[number]['id']>('NAME_ASC');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(pageSizeOptions[0]);
  const [creatorOpen, setCreatorOpen] = useState(false);

  const metrics = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((client) => client.status === 'Active').length;
    const waitlist = clients.filter((client) => client.status === 'Waitlist').length;
    const paused = clients.filter((client) => client.status === 'Paused').length;
    const avgCoverage =
      clients.reduce((acc, client) => acc + client.hoursDelivered / client.hoursPrescribed, 0) /
      (clients.length || 1);
    return {
      total,
      active,
      waitlist,
      paused,
      avgCoverage: Math.round(avgCoverage * 100)
    };
  }, [clients]);

  const filteredClients = useMemo(() => {
    const filtered = clients.filter((client) => {
      const matchesStatus = statusFilter === 'All' ? true : client.status === statusFilter;
      const searchValue = search.toLowerCase();
      const matchesSearch =
        client.name.toLowerCase().includes(searchValue) ||
        client.location.toLowerCase().includes(searchValue) ||
        client.id.toLowerCase().includes(searchValue);
      return matchesStatus && matchesSearch;
    });
    return filtered.sort((a, b) => {
      if (sort === 'NAME_ASC') return a.name.localeCompare(b.name);
      if (sort === 'AGE_ASC') return a.age - b.age;
      if (sort === 'AGE_DESC') return b.age - a.age;
      const coverageA = a.hoursDelivered / a.hoursPrescribed;
      const coverageB = b.hoursDelivered / b.hoursPrescribed;
      if (sort === 'COVERAGE_ASC') return coverageA - coverageB;
      if (sort === 'COVERAGE_DESC') return coverageB - coverageA;
      return 0;
    });
  }, [clients, statusFilter, search, sort]);

  const totalItems = filteredClients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);
  const paginatedClients = filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const effectiveSelectedId = filteredClients.some((client) => client.id === selectedId)
    ? selectedId
    : filteredClients[0]?.id ?? clients[0]?.id;
  const selectedClient =
    filteredClients.find((client) => client.id === effectiveSelectedId) ?? filteredClients[0] ?? clients[0];

  const selectedClientEmail = selectedClient
    ? `${selectedClient.name.split(' ')[0].toLowerCase()}@familyportal.com`
    : '';
  const selectedClientPhone = selectedClient
    ? `(512) 555-${(7000 + clients.findIndex((client) => client.id === selectedClient.id) * 5)
        .toString()
        .padStart(4, '0')}`
    : '';

  const waitlistEntry = schedulerSnapshot.waitlist.find((entry) => entry.client === selectedClient?.name);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Clients</p>
          <h2 className="text-3xl font-semibold text-slate-900">Family engagement console</h2>
          <p className="text-sm text-slate-500">
            Align prescriptions, caregiver expectations, and staffing ownership for every family on the platform.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreatorOpen(true)}
          className="ml-auto rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white"
        >
          + Add client
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total clients" value={metrics.total.toString()} helper="+2 admitted this week" />
        <MetricCard label="Active" value={metrics.active.toString()} helper="In treatment" />
        <MetricCard label="Waitlist" value={metrics.waitlist.toString()} helper="Need scheduling" highlight={metrics.waitlist > 0} />
        <MetricCard
          label="Avg. coverage"
          value={`${metrics.avgCoverage}%`}
          helper={metrics.paused ? `${metrics.paused} paused` : 'Fully staffed'}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.7fr,1fr]">
        <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Client roster</h3>
            <div className="ml-auto flex items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by name, location, ID"
                  className="w-60 bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                {statusFilters.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setStatusFilter(status);
                      setPage(1);
                    }}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-xs font-medium transition',
                      statusFilter === status
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {status}
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
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Location / modality</th>
                  <th className="px-4 py-3 font-medium">Coverage</th>
                  <th className="px-4 py-3 font-medium">BCBA</th>
                  <th className="px-4 py-3 font-medium">RBT</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedClients.map((client) => {
                  const coverage = Math.round((client.hoursDelivered / client.hoursPrescribed) * 100);
                  return (
                    <tr
                      key={client.id}
                      className={cn(
                        'cursor-pointer bg-white transition hover:bg-slate-50',
                        effectiveSelectedId === client.id && 'bg-emerald-50/60'
                      )}
                      onClick={() => setSelectedId(client.id)}
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{client.name}</p>
                        <p className="text-xs text-slate-500">
                          {client.age} yrs · {client.id}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        <p>{client.location}</p>
                        <p className="text-xs text-slate-400">{client.modalityMix}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-28 rounded-full bg-slate-100">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                coverage >= 90
                                  ? 'bg-emerald-400'
                                  : coverage >= 70
                                    ? 'bg-amber-400'
                                    : 'bg-rose-400'
                              )}
                              style={{ width: `${Math.min(coverage, 110)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">
                            {client.hoursDelivered}/{client.hoursPrescribed}h
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">{client.bcba}</td>
                      <td className="px-4 py-4 text-xs text-slate-600">{client.rbt}</td>
                      <td className="px-4 py-4">
                        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusClasses[client.status])}>
                          {client.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredClients.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={6}>
                      No clients match this search yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationFooter
            entityLabel="clients"
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
          {selectedClient ? (
            <>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-sky-200 to-violet-200 text-lg font-semibold text-slate-800">
                    {selectedClient.name
                      .split(' ')
                      .slice(0, 2)
                      .map((chunk) => chunk.charAt(0))
                      .join('')}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{selectedClient.name}</p>
                    <p className="text-sm text-slate-500">{selectedClient.location}</p>
                  </div>
                </div>
                <button className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">Open profile</button>
              </div>
              <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
                <div className="flex flex-wrap gap-2 text-xs">
                  <Chip label={`${selectedClient.hoursDelivered}/${selectedClient.hoursPrescribed}h`} intent="primary" />
                  <Chip label={selectedClient.status} intent={selectedClient.status === 'Waitlist' ? 'warning' : 'neutral'} />
                  <Chip label={selectedClient.modalityMix} intent="neutral" />
                </div>
                <p>
                  Caregiver:{' '}
                  <a href={`mailto:${selectedClientEmail}`} className="text-slate-900 underline">
                    {selectedClientEmail}
                  </a>
                </p>
                <p>Phone: {selectedClientPhone}</p>
              </div>
              <section className="space-y-2">
                <header className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Care team</p>
                    <p className="text-xs text-slate-500">Primary BCBA + assigned RBT</p>
                  </div>
                  <button className="rounded-full border border-slate-200 px-3 py-1 text-[0.65rem] text-slate-500">Swap</button>
                </header>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="rounded-2xl border border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{selectedClient.bcba}</p>
                    <p className="text-xs text-slate-500">BCBA · Oversees protocol modification</p>
                  </li>
                  {selectedClient.rbt !== '—' && (
                    <li className="rounded-2xl border border-slate-100 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{selectedClient.rbt}</p>
                      <p className="text-xs text-slate-500">RBT · Direct service hours</p>
                    </li>
                  )}
                </ul>
              </section>
              <section className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">Insights</p>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                    {selectedClient.hoursDelivered >= selectedClient.hoursPrescribed
                      ? 'Prescribed hours met — monitor maintenance.'
                      : `Needs ${selectedClient.hoursPrescribed - selectedClient.hoursDelivered}h more coverage this week.`}
                  </li>
                  <li className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">Caregiver prefers text reminders by 6pm.</li>
                  <li className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                    {waitlistEntry
                      ? `Migrated from waitlist ${waitlistEntry.priority} priority – requested windows ${waitlistEntry.preferredWindows}.`
                      : 'All authorizations current. Next renewal review in 30 days.'}
                  </li>
                </ul>
              </section>
              {waitlistEntry && (
                <section className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">Waitlist intake</p>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-xs text-amber-700">
                    <p>Preferred windows: {waitlistEntry.preferredWindows}</p>
                    <p>Requested service: {waitlistEntry.requestedService}</p>
                    <p>Staff preference: {waitlistEntry.staffPreferences}</p>
                  </div>
                </section>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">Select a client to see details.</p>
          )}
        </aside>
      </div>
      <ClientCreator open={creatorOpen} onClose={() => setCreatorOpen(false)} />
    </section>
  );
}

function MetricCard({ label, value, helper, highlight }: { label: string; value: string; helper: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-100 bg-white p-4 shadow-sm',
        highlight && 'border-amber-200 bg-amber-50/70'
      )}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <p className={cn('text-xs', highlight ? 'text-amber-600' : 'text-slate-500')}>{helper}</p>
    </div>
  );
}

function Chip({ label, intent }: { label: string; intent?: 'primary' | 'warning' | 'neutral' }) {
  if (intent === 'primary') return <span className="rounded-full bg-emerald-100 px-3 py-1 text-[0.65rem] font-semibold text-emerald-700">{label}</span>;
  if (intent === 'warning') return <span className="rounded-full bg-amber-100 px-3 py-1 text-[0.65rem] font-semibold text-amber-700">{label}</span>;
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
