import { OverviewView } from '@/features/platform/OverviewView';
import { overviewWindowOptions } from '@/features/platform/route-state';
import { healthFixture, overviewFixture, projectionFixture } from './preview-fixtures';

/** Dev-only: render the Overview surface with sample data, no backend. */
export function PreviewOverview() {
  const instanceId = 'inst_01HZX';
  return (
    <main className="min-h-dvh bg-bg">
      <OverviewView
        window="24h"
        windowOptions={overviewWindowOptions.map((option) => ({ value: option.value, label: option.label }))}
        onWindowChange={() => {}}
        onRefresh={() => {}}
        refreshing={false}
        initialLoading={false}
        health={{ ...healthFixture, instances: healthFixture.instances.filter((item) => item.instanceId === instanceId) }}
        overview={{ ...overviewFixture, scope: { type: 'instance', instanceId }, instances: { total: 1, connected: 1, disconnected: 0 } }}
        projection={{ ...projectionFixture, resources: projectionFixture.resources.filter((item) => item.instanceId === instanceId) }}
        recovery="unsupported"
        credentialScope="instance"
        authenticatedInstanceId={instanceId}
      />
    </main>
  );
}
