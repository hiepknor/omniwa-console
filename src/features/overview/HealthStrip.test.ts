import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { InstanceHealthResource, ProjectionHealthResource, ServerHealthResource } from '@/api/overview';
import { healthSummary, InstanceHealthGroups, instanceNeedsReview } from './HealthStrip';

function instance(overrides: Partial<InstanceHealthResource> = {}): InstanceHealthResource {
  return {
    instanceId: 'instance-1',
    connection: { status: 'connected', connected: true },
    projection: { status: 'healthy', total: 3, byStatus: {}, resources: [] },
    throttling: { status: 'healthy', observed: false, circuitState: 'closed' },
    ...overrides,
  };
}

const projection: ProjectionHealthResource = {
  status: 'healthy',
  total: 3,
  byStatus: {},
  resources: [],
};

function server(instances: InstanceHealthResource[] = []): ServerHealthResource {
  return { api: { status: 'healthy' }, instances };
}

describe('Overview health semantics', () => {
  it('never reports operational when the API is unhealthy', () => {
    expect(healthSummary({ api: { status: 'failed' }, instances: [] }, projection)).toBe('Platform needs review');
  });

  it('treats an unavailable or degraded aggregate projection as a platform issue', () => {
    expect(healthSummary(server(), undefined, true)).toBe('Platform needs review');
    expect(healthSummary(server(), { ...projection, status: 'degraded' })).toBe('Platform needs review');
  });

  it('counts unhealthy instances independently from platform health', () => {
    const disconnected = instance({ connection: { status: 'disconnected', connected: false } });
    const throttled = instance({ instanceId: 'instance-2', throttling: { status: 'throttled', observed: true, circuitState: 'open' } });
    expect(instanceNeedsReview(disconnected)).toBe(true);
    expect(instanceNeedsReview(throttled)).toBe(true);
    expect(healthSummary(server([disconnected, throttled]), projection)).toBe('2 instances need review');
  });

  it('reports operational only when every observed dimension is healthy', () => {
    expect(instanceNeedsReview(instance())).toBe(false);
    expect(healthSummary(server([instance()]), projection)).toBe('Operational');
  });

  it('renders every instance identifier as visible, accessible grouping text', () => {
    const html = renderToStaticMarkup(InstanceHealthGroups({ instances: [
      instance({ instanceId: 'instance-alpha' }),
      instance({ instanceId: 'instance-bravo', connection: { status: 'disconnected', connected: false }, throttling: { status: 'throttled', observed: true, circuitState: 'open', retryAfterSeconds: 45, openUntil: '2026-07-23T01:00:45Z' } }),
    ] }));
    expect(html).toContain('Health dimensions grouped by instance');
    expect(html).toContain('instance-alpha');
    expect(html).toContain('instance-bravo');
    expect(html).toContain('aria-labelledby="overview-instance-health-0"');
    expect(html).toContain('aria-labelledby="overview-instance-health-1"');
    expect(html).toContain('retry in 45s');
    expect(html).toContain('until');
  });
});
