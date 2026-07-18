export function relativeTime(iso: string | undefined): string {
  if (iso === undefined) return '';

  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return '';

  const elapsedMs = Math.max(0, Date.now() - timestamp);
  const elapsedMinutes = Math.floor(elapsedMs / 60_000);
  if (elapsedMinutes < 1) return 'just now';
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;

  return `${Math.floor(elapsedHours / 24)}d ago`;
}

const countFormatter = new Intl.NumberFormat('en-US');

export function formatCount(n: number | undefined): string {
  return n === undefined ? '—' : countFormatter.format(n);
}

export function formatClockTime(iso: string | undefined): string {
  if (iso === undefined) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function calendarDayKey(iso: string | undefined): string {
  if (iso === undefined) return 'unknown';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function calendarDayLabel(iso: string | undefined): string {
  if (iso === undefined) return 'Date unavailable';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const messageDay = new Date(date);
  messageDay.setHours(0, 0, 0, 0);
  const elapsedDays = Math.round((today.getTime() - messageDay.getTime()) / 86_400_000);
  if (elapsedDays === 0) return 'Today';
  if (elapsedDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
