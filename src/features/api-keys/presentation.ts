import type { ApiKeyResource } from '@/api/api-keys';

export function keyKindLabel(kind: ApiKeyResource['kind']): string {
  switch (kind) {
    case 'api_key': return 'API key';
    case 'admin_key': return 'Admin key';
    case 'monitoring_key': return 'Monitoring key';
  }
}

export function sameValues(left: readonly string[], right: readonly string[]): boolean {
  const a = [...left].sort();
  const b = [...right].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
