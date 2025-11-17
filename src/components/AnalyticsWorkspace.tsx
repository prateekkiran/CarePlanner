'use client';

import { useMemo, useState } from 'react';
import { schedulerSnapshot } from '@/lib/mockData';
import { cn } from '@/lib/utils';

type AnalyticsTab =
  | 'overview'
  | 'scheduling'
  | 'staff'
  | 'clients'
  | 'cancellations'
  | 'authorizations'
  | 'operational';

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hourBuckets = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
const dateOptions = ['This week', 'Last week', 'Last 4 weeks', 'This month'];
const careSettings = ['All', 'Center', 'Home', 'School', 'Telehealth'];
const fundingSources = ['All', 'Medicaid', 'Commercial', 'Private pay', 'School'];

export function AnalyticsWorkspace() {
  const [filters, setFilters] = useState({
    dateRange: dateOptions[0],
    location: 'All locations',
    careSetting: 'All',
    funding: 'All'
  });
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [focus, setFocus] = useState<{ tab: AnalyticsTab; label: string } | null>(null);

  const appointments = schedulerSnapshot.appointments;
  const clients = schedulerSnapshot.clients;
  const staffAvailability = schedulerSnapshot.availability;
  const authorizations = schedulerSnapshot.authorizations;

  const heatmapData = useMemo(() => {
    const buckets: Record<string, Record<string, number>> = {};
    dayLabels.forEach((day) => {
      buckets[day] = {};
      hourBuckets.forEach((hour) => {
        buckets[day][hour] = 0;
      });
    });
    appointments.forEach((appointment) => {
      const start = new Date(appointment.scheduledStart);
      const day = dayLabels[start.getDay() === 0 ? 6 : start.getDay() - 1];
      const hour = hourBuckets.find((bucket) => start.getHours() <= Number(bucket.split(':')[0])) ?? hourBuckets[hourBuckets.length - 1];
      buckets[day][hour] = (buckets[day][hour] ?? 0) + 1;
    });
    return buckets;
  }, [appointments]);

  const cancellationTrend = useMemo(
    () => [
      { week: 'Week 1', scheduled: 120, completed: 100, cancelled: 15, noShow: 5 },
      { week: 'Week 2', scheduled: 128, completed: 105, cancelled: 18, noShow: 5 },
      { week: 'Week 3', scheduled: 132, completed: 110, cancelled: 15, noShow: 7 },
      { week: 'Week 4', scheduled: 140, completed: 118, cancelled: 14, noShow: 8 }
    ],
    []
  );

  const coverageBands = useMemo(() => {
    return clients.map((client) => {
      const coverage = client.hoursPrescribed ? Math.round((client.hoursDelivered / client.hoursPrescribed) * 100) : 0;
      return {
        client: client.name,
        coverage,
        bcba: client.bcba,
        rbt: client.rbt,
        location: client.location,
        status: client.status
      };
    });
  }, [clients]);

  const staffUtilization = useMemo(() => {
    return staffAvailability.map((staff) => {
      const ratio = staff.target ? Math.round((staff.load / staff.target) * 100) : 0;
      const band = ratio < 75 ? 'Underbooked' : ratio < 95 ? 'Healthy' : 'Overbooked';
      return {
        name: staff.staffName,
        ratio,
        band,
        location: staff.location,
        credential: staff.credential
      };
    });
  }, [staffAvailability]);

  const authList = useMemo(
    () =>
      Object.values(authorizations).map((auth) => {
        const remainingPct = auth.authorizedMinutes
          ? Math.round((auth.remainingMinutes / auth.authorizedMinutes) * 100)
          : 0;
        return {
          client: auth.clientName,
          payer: auth.payer,
          expiresOn: auth.expiresOn,
          remainingMinutes: auth.remainingMinutes,
          remainingPct,
          serviceCodes: auth.serviceCodes.join(', ')
        };
      }),
    [authorizations]
  );

  const waitlist = schedulerSnapshot.waitlist;

  const overviewTiles = [
    {
      title: 'Scheduled vs Target',
      primary: `${appointments.length * 2} hrs`,
      helper: 'Target 220 hrs',
      action: () => handleDrill('scheduling', 'Capacity view filtered')
    },
    {
      title: 'Staff utilization',
      primary: `Underbooked: ${staffUtilization.filter((staff) => staff.band === 'Underbooked').length}`,
      helper: 'Click to view staff bands',
      action: () => handleDrill('staff', 'Underbooked staff')
    },
    {
      title: 'Cancel + no-show rate',
      primary: '18%',
      helper: 'No-show 7%, late cancel 11%',
      action: () => handleDrill('cancellations', 'Cancellations trend')
    },
    {
      title: 'Auth risk',
      primary: `${authList.filter((auth) => auth.remainingPct < 20).length} expiring`,
      helper: 'Inside 30 days',
      action: () => handleDrill('authorizations', 'Expiring authorizations')
    },
    {
      title: 'Waitlist',
      primary: `${waitlist.length} clients`,
      helper: 'Avg wait 21 days',
      action: () => handleDrill('operational', 'Waitlist funnel')
    }
  ];

  function handleDrill(tab: AnalyticsTab, label: string) {
    setActiveTab(tab);
    setFocus({ tab, label });
  }

  const filteredStaff = focus?.tab === 'staff' && focus.label.includes('Underbooked')
    ? staffUtilization.filter((staff) => staff.band === 'Underbooked')
    : staffUtilization;

  const filteredCoverage = focus?.tab === 'clients' && focus.label.includes('Under-covered')
    ? coverageBands.filter((entry) => entry.coverage < 80)
    : coverageBands;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Analytics</p>
        <h2 className="text-3xl font-semibold text-slate-900">Signals & interventions</h2>
        <p className="text-sm text-slate-500">
          Surface utilization, waitlist pressure, EVV risk, and action cards across personas in one canvas.
        </p>
      </header>

      <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-4">
          <FilterSelect label="Date range" value={filters.dateRange} options={dateOptions} onChange={(value) => setFilters((prev) => ({ ...prev, dateRange: value }))} />
          <FilterSelect label="Location" value={filters.location} options={['All locations', 'Austin - North Center', 'Telehealth Hub']} onChange={(value) => setFilters((prev) => ({ ...prev, location: value }))} />
          <FilterSelect label="Care setting" value={filters.careSetting} options={careSettings} onChange={(value) => setFilters((prev) => ({ ...prev, careSetting: value }))} />
          <FilterSelect label="Funding source" value={filters.funding} options={fundingSources} onChange={(value) => setFilters((prev) => ({ ...prev, funding: value }))} />
        </div>
      </div>

      <nav className="flex flex-wrap gap-2">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'scheduling', label: 'Scheduling & capacity' },
          { id: 'staff', label: 'Staff utilization' },
          { id: 'clients', label: 'Client coverage' },
          { id: 'cancellations', label: 'Cancellations & no-shows' },
          { id: 'authorizations', label: 'Auth & revenue risk' },
          { id: 'operational', label: 'Operational health' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as AnalyticsTab);
              setFocus(null);
            }}
            className={cn(
              'rounded-full border px-4 py-2 text-sm',
              activeTab === tab.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {overviewTiles.map((tile) => (
              <button
                key={tile.title}
                type="button"
                onClick={tile.action}
                className="rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-emerald-200"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{tile.title}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{tile.primary}</p>
                <p className="text-xs text-slate-500">{tile.helper}</p>
                <span className="mt-3 inline-flex text-xs text-emerald-600">Open detail →</span>
              </button>
            ))}
          </div>
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scheduling heatmap</p>
                <p className="text-sm text-slate-500">See busy cells to route waitlist fills.</p>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-xs text-slate-600">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-slate-400">Time</th>
                    {dayLabels.map((day) => (
                      <th key={day} className="p-2 text-left text-slate-400">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hourBuckets.map((hour) => (
                    <tr key={hour}>
                      <td className="p-2 font-semibold text-slate-500">{hour}</td>
                      {dayLabels.map((day) => {
                        const value = heatmapData[day][hour];
                        return (
                          <td key={day} className="p-1">
                            <button
                              type="button"
                              onClick={() => handleDrill('scheduling', `${day} ${hour}`)}
                              className={cn(
                                'grid h-10 place-items-center rounded-lg text-[0.65rem]',
                                value === 0
                                  ? 'bg-slate-50 text-slate-400'
                                  : value < 3
                                    ? 'bg-teal-50 text-teal-600'
                                    : value < 6
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-rose-100 text-rose-700'
                              )}
                            >
                              {value}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cancellations trend</p>
              <div className="mt-4 space-y-3 text-xs text-slate-600">
                {cancellationTrend.map((point) => (
                  <button
                    key={point.week}
                    type="button"
                    onClick={() => handleDrill('cancellations', `Detail ${point.week}`)}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2"
                  >
                    <span>{point.week}</span>
                    <span>
                      Sched {point.scheduled} · Completed {point.completed} · Canc {point.cancelled} · No-show {point.noShow}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Auth & revenue risk</p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                {authList.slice(0, 5).map((auth) => (
                  <li key={auth.client} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{auth.client}</p>
                      <p className="text-slate-500">
                        {auth.payer} · {auth.serviceCodes}
                      </p>
                    </div>
                    <p className={cn('text-sm font-semibold', auth.remainingPct < 20 ? 'text-rose-600' : 'text-slate-600')}>
                      {auth.remainingPct}% left
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'scheduling' && (
        <AnalyticsPanel
          title="Scheduling & capacity"
          description="Compare booked hours vs location capacity and see session mix."
          focus={focus}
          tabId="scheduling"
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <Tile label="Total scheduled hours" value={`${appointments.length * 2} hrs`} helper="vs 240 hr capacity" />
            <Tile label="Avg room utilization" value="74%" helper="Center pods only" />
            <Tile label="Avg time-to-fill cancellation" value="16 hrs" helper="⭢ Reduce wait time" />
          </div>
          <section className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Capacity by location</p>
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                {['Austin - North Center', 'Telehealth Hub', 'Jefferson Elementary'].map((location) => (
                  <button
                    key={location}
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, location }))}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-2"
                  >
                    <span>{location}</span>
                    <span className="text-xs text-slate-400">210 hrs cap · 165 hrs scheduled</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Sessions by care setting</p>
              <div className="mt-4 space-y-2 text-xs">
                {['Center', 'Home', 'School', 'Telehealth'].map((setting, index) => (
                  <div key={setting} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span>{setting}</span>
                      <span>{[55, 20, 10, 15][index]}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-emerald-500"
                        style={{ width: `${[55, 20, 10, 15][index]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="mt-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Gaps & overlaps</p>
            <table className="mt-3 w-full text-xs text-slate-600">
              <thead>
                <tr className="text-slate-400">
                  <th className="py-2 text-left">Date</th>
                  <th className="py-2 text-left">Window</th>
                  <th className="py-2 text-left">Issue</th>
                  <th className="py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: 'Apr 8', window: '1–3 PM', issue: 'No RBT available at Center A', action: 'View staff' },
                  { date: 'Apr 9', window: '9–10 AM', issue: 'Group room idle (book waitlist)', action: 'Open waitlist' },
                  { date: 'Apr 10', window: '4–6 PM', issue: 'Telehealth booth double booked', action: 'Review rooms' }
                ].map((item) => (
                  <tr key={item.issue}>
                    <td className="py-2">{item.date}</td>
                    <td className="py-2">{item.window}</td>
                    <td className="py-2">{item.issue}</td>
                    <td className="py-2">
                      <button className="rounded-full border border-slate-200 px-3 py-1 text-[0.65rem] text-slate-500">
                        {item.action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </AnalyticsPanel>
      )}

      {activeTab === 'staff' && (
        <AnalyticsPanel title="Staff utilization" description="See load bands and tap into staff coverage actions." focus={focus} tabId="staff">
          <div className="grid gap-3 md:grid-cols-3">
            {['Underbooked', 'Healthy', 'Overbooked'].map((band) => (
              <button
                key={band}
                type="button"
                onClick={() => setFocus({ tab: 'staff', label: `${band} staff filter` })}
                className="rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-sm"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{band}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {staffUtilization.filter((staff) => staff.band === band).length} staff
                </p>
                <p className="text-xs text-slate-500">Click to drill into roster</p>
              </button>
            ))}
          </div>
          <table className="mt-4 w-full text-sm text-slate-600">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="py-2 text-left">Staff</th>
                <th className="py-2 text-left">Utilization</th>
                <th className="py-2 text-left">Band</th>
                <th className="py-2 text-left">Location</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((staff) => (
                <tr key={staff.name} className="border-t border-slate-100">
                  <td className="py-2">{staff.name}</td>
                  <td className="py-2">{staff.ratio}%</td>
                  <td className="py-2 text-xs">
                    <span
                      className={cn(
                        'rounded-full px-3 py-1',
                        staff.band === 'Underbooked'
                          ? 'bg-amber-100 text-amber-700'
                          : staff.band === 'Overbooked'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                      )}
                    >
                      {staff.band}
                    </span>
                  </td>
                  <td className="py-2 text-xs text-slate-500">{staff.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AnalyticsPanel>
      )}

      {activeTab === 'clients' && (
        <AnalyticsPanel
          title="Client coverage & intensity"
          description="Monitor prescribed vs delivered hours and intervene quickly."
          focus={focus}
          tabId="clients"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Tile label="Coverage ≥ 90%" value={`${coverageBands.filter((entry) => entry.coverage >= 90).length} families`} helper="On track" />
            <Tile label="Coverage < 80%" value={`${coverageBands.filter((entry) => entry.coverage < 80).length} families`} helper="Needs attention" />
          </div>
          <table className="mt-4 w-full text-sm text-slate-600">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="py-2 text-left">Client</th>
                <th className="py-2 text-left">Coverage</th>
                <th className="py-2 text-left">BCBA</th>
                <th className="py-2 text-left">RBT</th>
                <th className="py-2 text-left">Location</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoverage.map((entry) => (
                <tr key={entry.client} className="border-t border-slate-100">
                  <td className="py-2">{entry.client}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-slate-100">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            entry.coverage >= 90 ? 'bg-emerald-400' : entry.coverage >= 80 ? 'bg-amber-400' : 'bg-rose-400'
                          )}
                          style={{ width: `${entry.coverage}%` }}
                        />
                      </div>
                      <span>{entry.coverage}%</span>
                    </div>
                  </td>
                  <td className="py-2 text-xs text-slate-500">{entry.bcba}</td>
                  <td className="py-2 text-xs text-slate-500">{entry.rbt}</td>
                  <td className="py-2 text-xs text-slate-500">{entry.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AnalyticsPanel>
      )}

      {activeTab === 'cancellations' && (
        <AnalyticsPanel title="Cancellations & no-shows" description="Spot trends by week, reason, and actor." focus={focus} tabId="cancellations">
          <div className="grid gap-4 md:grid-cols-2">
            <Tile label="Overall cancel rate" value="18%" helper="Goal < 12%" />
            <Tile label="Estimated lost hours" value="34 hrs" helper="No-shows + late cancels" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {['Client sick', 'Staff sick', 'Transportation', 'Weather', 'Unknown'].slice(0, 4).map((reason, index) => (
              <div key={reason} className="rounded-3xl border border-slate-100 bg-white p-4 text-xs text-slate-600">
                <p className="text-slate-400">{reason}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{[12, 9, 5, 3][index]} cases</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Top problem areas</p>
            <table className="mt-3 w-full text-sm text-slate-600">
              <thead>
                <tr className="text-xs text-slate-400">
                  <th className="py-2 text-left">Client</th>
                  <th className="py-2 text-left">Cancelled</th>
                  <th className="py-2 text-left">No-shows</th>
                  <th className="py-2 text-left">Primary staff</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { client: 'Mason Tillery', cancelled: 4, noShow: 1, staff: 'Jules Bernal' },
                  { client: 'Nova Hernandez', cancelled: 3, noShow: 2, staff: 'Sasha Kim' },
                  { client: 'Harper Lyons', cancelled: 2, noShow: 1, staff: 'Jordan Patel' }
                ].map((row) => (
                  <tr key={row.client} className="border-t border-slate-100">
                    <td className="py-2">{row.client}</td>
                    <td className="py-2">{row.cancelled}</td>
                    <td className="py-2">{row.noShow}</td>
                    <td className="py-2 text-xs text-slate-500">{row.staff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnalyticsPanel>
      )}

      {activeTab === 'authorizations' && (
        <AnalyticsPanel title="Authorization & revenue risk" description="Track expiring or low balance authorizations." focus={focus} tabId="authorizations">
          <div className="grid gap-4 md:grid-cols-2">
            <Tile label="Auth expiring in 30 days" value={`${authList.filter((auth) => daysUntil(auth.expiresOn) <= 30).length}`} helper="Prioritize renewals" />
            <Tile label="Clients <20% remaining" value={`${authList.filter((auth) => auth.remainingPct < 20).length}`} helper="Risk of denial" />
          </div>
          <table className="mt-4 w-full text-sm text-slate-600">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="py-2 text-left">Client</th>
                <th className="py-2 text-left">Payer</th>
                <th className="py-2 text-left">Rem. minutes</th>
                <th className="py-2 text-left">% remaining</th>
                <th className="py-2 text-left">End date</th>
              </tr>
            </thead>
            <tbody>
              {authList.map((auth) => (
                <tr key={auth.client} className="border-t border-slate-100">
                  <td className="py-2">{auth.client}</td>
                  <td className="py-2">{auth.payer}</td>
                  <td className="py-2">{auth.remainingMinutes}</td>
                  <td className="py-2">
                    <span className={cn('rounded-full px-3 py-1 text-xs', auth.remainingPct < 20 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700')}>
                      {auth.remainingPct}%
                    </span>
                  </td>
                  <td className="py-2 text-xs text-slate-500">
                    {new Date(auth.expiresOn).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AnalyticsPanel>
      )}

      {activeTab === 'operational' && (
        <AnalyticsPanel title="Operational health" description="Waitlist movement and time-to-fill cancellations." focus={focus} tabId="operational">
          <div className="grid gap-4 md:grid-cols-2">
            <Tile label="Waitlisted clients" value={`${waitlist.length}`} helper="Goal < 15" />
            <Tile label="Avg wait time" value="21 days" helper="Time to first session" />
          </div>
          <section className="mt-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Waitlist funnel</p>
            <div className="mt-4 grid gap-2 text-xs text-slate-600">
              {[
                { stage: 'Intake created', count: 40 },
                { stage: 'Cleared for scheduling', count: 32 },
                { stage: 'First session scheduled', count: 22 },
                { stage: 'First session completed', count: 18 }
              ].map((step, index) => (
                <div key={step.stage} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>{step.stage}</span>
                    <span>{step.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-300 to-indigo-500"
                      style={{ width: `${(step.count / 40) * 100}%` }}
                    />
                  </div>
                  {index < 3 && <p className="text-[0.6rem] text-slate-400">Avg {index === 0 ? '5' : index === 1 ? '7' : '4'} days to next step</p>}
                </div>
              ))}
            </div>
          </section>
          <table className="mt-4 w-full text-sm text-slate-600">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="py-2 text-left">Client</th>
                <th className="py-2 text-left">Added</th>
                <th className="py-2 text-left">Requested</th>
                <th className="py-2 text-left">Preferred</th>
                <th className="py-2 text-left">Priority</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.map((entry) => (
                <tr key={entry.id} className="border-t border-slate-100">
                  <td className="py-2">{entry.client}</td>
                  <td className="py-2 text-xs text-slate-500">{entry.preferredWindows}</td>
                  <td className="py-2 text-xs text-slate-500">{entry.requestedService}</td>
                  <td className="py-2 text-xs text-slate-500">{entry.notes}</td>
                  <td className="py-2 text-xs text-slate-500">{entry.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AnalyticsPanel>
      )}
    </section>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 text-xs text-slate-500">
      <span className="block font-semibold">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function AnalyticsPanel({
  title,
  description,
  children,
  focus,
  tabId
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  focus: { tab: AnalyticsTab; label: string } | null;
  tabId: AnalyticsTab;
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        {focus && focus.tab === tabId && (
          <span className="ml-auto rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-600">{focus.label}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Tile({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function daysUntil(date: string) {
  const diff = new Date(date).getTime() - Date.now();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}
