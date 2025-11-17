'use client';

import { useMemo, useState } from 'react';
import { schedulerSnapshot } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { RoomCreator, type NewRoomPayload, type RoomStatus } from './RoomCreator';

type RoomView = 'grid' | 'table';
type RoomType = 'Therapy' | 'Group' | 'Telehealth' | 'Assessment' | 'Multipurpose';

const typeFilters: Array<RoomType | 'All'> = ['All', 'Therapy', 'Group', 'Assessment', 'Telehealth', 'Multipurpose'];
const statusFilters: Array<RoomStatus | 'All'> = ['All', 'Active', 'Inactive'];
const pageSizeOptions = [8, 12, 20] as const;

const resourceInventory = [
  {
    id: 'res-telehealth-kit',
    name: 'Telehealth Kit · Zoom',
    type: 'Telehealth license',
    status: 'Active',
    qty: 8,
    utilization: '6 in use',
    scope: 'All locations'
  },
  {
    id: 'res-ipad-3',
    name: 'iPad #3',
    type: 'Device',
    status: 'Active',
    qty: 1,
    utilization: 'Booked 2pm—4pm',
    scope: 'Austin - North'
  }
];

type RoomCard = {
  id: string;
  name: string;
  location: string;
  capacity: number;
  type: RoomType | string;
  displayType: string;
  bookedHours: number;
  availableHours: number;
  status: RoomStatus;
  attributes: string[];
  allowedSessions: string[];
  notes?: string;
};

export function RoomsWorkspace() {
  const [roomList, setRoomList] = useState<RoomCard[]>(() =>
    schedulerSnapshot.rooms.map((room, index) => ({
      id: room.id,
      name: room.name,
      location: room.location,
      capacity: room.capacity,
      type: room.type,
      displayType: mapBaseTypeToDisplay(room.type),
      bookedHours: room.bookedHours,
      availableHours: room.availableHours,
      status: index % 3 === 0 ? 'Inactive' : 'Active',
      attributes:
        room.type === 'Group'
          ? ['Observation window', 'Quiet']
          : room.type === 'Telehealth'
            ? ['Telehealth-ready', 'Sound dampening']
            : ['Flexible seating'],
      allowedSessions: room.type === 'Group' ? ['Group ABA'] : ['Direct ABA', 'Assessment']
    }))
  );

  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('All locations');
  const [typeFilter, setTypeFilter] = useState<typeof typeFilters[number]>('All');
  const [statusFilter, setStatusFilter] = useState<typeof statusFilters[number]>('All');
  const [view, setView] = useState<RoomView>('grid');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(pageSizeOptions[0]);
  const [creatorOpen, setCreatorOpen] = useState(false);

  const locations = ['All locations', ...Array.from(new Set(roomList.map((room) => room.location)))];

  const filteredRooms = useMemo(() => {
    return roomList.filter((room) => {
      const matchesLocation = locationFilter === 'All locations' ? true : room.location === locationFilter;
      const matchesType = typeFilter === 'All' ? true : room.type === typeFilter;
      const matchesStatus = statusFilter === 'All' ? true : room.status === statusFilter;
      const matchesSearch = room.name.toLowerCase().includes(search.toLowerCase()) || room.location.toLowerCase().includes(search.toLowerCase());
      return matchesLocation && matchesType && matchesStatus && matchesSearch;
    });
  }, [roomList, locationFilter, typeFilter, statusFilter, search]);

  const totalItems = filteredRooms.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRooms = filteredRooms.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const utilizationAverage = Math.round(
    roomList.reduce((sum, room) => sum + (room.bookedHours / room.availableHours || 1) * 100, 0) / roomList.length
  );

  const handleSaveRoom = (payload: NewRoomPayload) => {
    const baseType = displayTypeToBase(payload.displayType);
    const availableHours = payload.availability.inheritLocation
      ? 40
      : payload.availability.customBlocks
          .filter((block) => block.enabled)
          .reduce((total, block) => total + calculateDuration(block.start, block.end), 0);
    const newRoom: RoomCard = {
      id: `RM-${Date.now()}`,
      name: payload.name,
      location: payload.location,
      capacity: payload.maxClients,
      type: baseType,
      displayType: payload.displayType,
      bookedHours: 0,
      availableHours: Math.max(availableHours, 1),
      status: payload.status,
      attributes: payload.attributes.length ? payload.attributes : ['Flexible seating'],
      allowedSessions: payload.allowedSessions.length ? payload.allowedSessions : ['Direct ABA'],
      notes: payload.availability.notes
    };

    setRoomList((prev) => [...prev, newRoom]);
    setCreatorOpen(false);
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Rooms & resources</p>
          <h2 className="text-3xl font-semibold text-slate-900">Environment & capacity control</h2>
          <p className="text-sm text-slate-500">
            Track pod saturation, telehealth suites, and device pools to keep client experiences calm and compliant.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreatorOpen(true)}
          className="ml-auto rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white"
        >
          + Add room
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total rooms" value={roomList.length.toString()} helper={`${utilizationAverage}% avg utilization`} />
        <MetricCard label="Active rooms" value={roomList.filter((room) => room.status === 'Active').length.toString()} helper="Available for scheduling" />
        <MetricCard label="Telehealth suites" value={roomList.filter((room) => room.type === 'Telehealth').length.toString()} helper="Soundproof pods" />
        <MetricCard label="Device pools" value={resourceInventory.length.toString()} helper="Critical resources tracked" />
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold text-slate-500">
              <span className="sr-only">Location</span>
              <select
                value={locationFilter}
                onChange={(event) => {
                  setLocationFilter(event.target.value);
                  setPage(1);
                }}
                className="rounded-full border border-slate-200 px-4 py-1.5 text-xs text-slate-600"
              >
                {locations.map((location) => (
                  <option key={location}>{location}</option>
                ))}
              </select>
            </label>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1">
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by room or location"
                className="w-60 bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold',
                view === 'grid' ? 'bg-slate-900 text-white' : 'border-slate-200 text-slate-500'
              )}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold',
                view === 'table' ? 'bg-slate-900 text-white' : 'border-slate-200 text-slate-500'
              )}
            >
              Table
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {typeFilters.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setTypeFilter(type);
                setPage(1);
              }}
              className={cn(
                'rounded-full border px-3 py-1 text-xs',
                typeFilter === type ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'
              )}
            >
              {type}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            {statusFilters.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs',
                  statusFilter === status ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {view === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedRooms.map((room) => {
              const utilization = Math.round((room.bookedHours / room.availableHours) * 100);
              return (
                <article key={room.id} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                  <header className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{room.name}</p>
                      <p className="text-xs text-slate-500">{room.location}</p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-[0.65rem] font-semibold',
                        room.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {room.status}
                    </span>
                  </header>
                  <div className="mt-3 space-y-2 text-xs text-slate-500">
                    <p>
                      Type: <span className="font-semibold text-slate-800">{room.displayType}</span> · Capacity {room.capacity}
                    </p>
                    <p>Usage today: {room.usageToday}</p>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                        style={{ width: `${Math.min(utilization, 110)}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {room.attributes.map((attribute) => (
                        <span key={attribute} className="rounded-full bg-slate-50 px-3 py-1 text-[0.6rem] text-slate-500">
                          {attribute}
                        </span>
                      ))}
                    </div>
                  </div>
                  <footer className="mt-4 flex flex-wrap gap-2 text-xs">
                    <button className="rounded-full border border-slate-200 px-3 py-1 text-slate-500">View schedule</button>
                    <button className="rounded-full border border-slate-200 px-3 py-1 text-slate-500">Edit</button>
                  </footer>
                </article>
              );
            })}
            {paginatedRooms.length === 0 && (
              <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No rooms match this search.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-auto rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedRooms.map((room) => (
                  <tr key={room.id} className="bg-white">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{room.name}</p>
                      <p className="text-xs text-slate-500">{room.location}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{room.displayType}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{room.capacity}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {room.usageToday} ({Math.round((room.bookedHours / room.availableHours) * 100)}%)
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-[0.65rem] font-semibold',
                          room.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        {room.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {paginatedRooms.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={5}>
                      No rooms match this search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <PaginationFooter
          entityLabel="rooms"
          page={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          startIndex={totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          endIndex={totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems)}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
        />
      </div>

      <section className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <header className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Critical resources</p>
            <p className="text-lg font-semibold text-slate-900">Devices & licenses</p>
          </div>
          <button className="ml-auto rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">Manage pools</button>
        </header>
        <div className="grid gap-3 md:grid-cols-2">
          {resourceInventory.map((resource) => (
            <article key={resource.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">{resource.name}</p>
                <span className="rounded-full bg-white px-3 py-1 text-[0.65rem] text-slate-500">{resource.type}</span>
              </div>
              <p className="text-xs text-slate-500">{resource.scope}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>Status: {resource.status}</span>
                <span>Qty: {resource.qty}</span>
                <span>{resource.utilization}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {creatorOpen && <RoomCreator onClose={() => setCreatorOpen(false)} onSave={handleSaveRoom} />}
    </section>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function mapBaseTypeToDisplay(type: string): string {
  if (type === 'Group') return 'Group therapy';
  if (type === 'Telehealth') return 'Telehealth booth';
  if (type === 'Therapy') return 'Individual therapy';
  return type;
}

function displayTypeToBase(display: string): RoomType {
  if (display === 'Group therapy') return 'Group';
  if (display === 'Telehealth booth') return 'Telehealth';
  return 'Therapy';
}

function calculateDuration(start: string, end: string) {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  const diff = Math.max(endMinutes - startMinutes, 0);
  return diff / 60;
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
