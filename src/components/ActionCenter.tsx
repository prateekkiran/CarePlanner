import { NotificationItem } from '@/lib/types';

interface ActionCenterProps {
  notifications: NotificationItem[];
}

export function ActionCenter({ notifications }: ActionCenterProps) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Action center</p>
      <h3 className="text-lg font-semibold text-slate-900">Notifications & caregiver requests</h3>
      <div className="mt-4 space-y-3 text-sm">
        {notifications.map((notification) => (
          <article key={notification.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{notification.time}</span>
              <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-slate-600">
                {notification.channel}
              </span>
            </div>
            <p className="mt-2 text-base font-semibold text-slate-900">{notification.summary}</p>
            <p className="text-slate-500">{notification.detail}</p>
            <div className="mt-3 flex gap-2">
              <button className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">Acknowledge</button>
              <button className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">Open record</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
