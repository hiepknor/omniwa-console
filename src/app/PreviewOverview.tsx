import { OverviewView } from '@/features/platform-v2/OverviewView';
import { healthFixture, overviewFixture, projectionFixture } from './preview-fixtures';

/** Dev-only: render the Overview surface with sample data, no backend. */
export function PreviewOverview() {
  return (
    <div className="min-h-dvh bg-bg">
      <OverviewView
        window="24h"
        windowOptions={[
          { value: '1h', label: 'Last hour' },
          { value: '24h', label: 'Last 24 hours' },
          { value: '7d', label: 'Last 7 days' },
        ]}
        onWindowChange={() => {}}
        onRefresh={() => {}}
        refreshing={false}
        initialLoading={false}
        health={healthFixture}
        overview={overviewFixture}
        projection={projectionFixture}
        recovery="available"
      />
    </div>
  );
}
