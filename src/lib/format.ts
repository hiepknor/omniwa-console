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
