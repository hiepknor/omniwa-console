import { OverviewView } from '@/features/platform/OverviewView';
import { overviewWindowOptions } from '@/features/platform/route-state';
import { healthFixture, overviewFixture, projectionFixture } from './preview-fixtures';

/** Dev-only: render the Overview surface with sample data, no backend. */
export function PreviewOverview() {
  return (
    <main className="min-h-dvh bg-bg">
      <OverviewView
        window="24h"
        windowOptions={overviewWindowOptions.map((option) => ({ value: option.value, label: option.label }))}
        onWindowChange={() => {}}
        onRefresh={() => {}}
        refreshing={false}
        initialLoading={false}
        health={healthFixture}
        overview={overviewFixture}
        projection={projectionFixture}
        recovery="available"
      />
    </main>
  );
}
