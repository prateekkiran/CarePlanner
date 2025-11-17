export const DAY_START = 7;
export const DAY_END = 20;

export const HOURS = Array.from({ length: DAY_END - DAY_START + 1 }, (_, idx) => DAY_START + idx);

export const shortTime = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit'
});

export const shortDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric'
});

export function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${shortDate.format(startDate)} · ${shortTime.format(startDate)} - ${shortTime.format(endDate)}`;
}

export function formatTimestamp(date: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC'
  });
  return formatter.format(new Date(date));
}

export function formatShortDate(date: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC'
  });
  return formatter.format(new Date(date));
}
