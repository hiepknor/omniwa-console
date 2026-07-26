import { useState } from 'react';
import { RecoveryView, failureIdentity } from '@/features/platform-v2/RecoveryView';
import { failuresFixture } from './preview-fixtures';

/** Dev-only: Projection recovery queue with sample data. */
export function PreviewRecovery() {
  const [selected, setSelected] = useState(failuresFixture[0]);
  return (
    <div className="min-h-dvh bg-bg">
      <RecoveryView
        refreshing={false}
        onRefresh={() => {}}
        instanceDraft=""
        resourceDraft=""
        onInstanceDraft={() => {}}
        onResourceDraft={() => {}}
        limit={50}
        onLimit={() => {}}
        onApply={(e) => e.preventDefault()}
        initialLoading={false}
        empty={false}
        items={failuresFixture}
        selectedKey={failureIdentity(selected)}
        onSelect={setSelected}
        cursor={undefined}
        nextCursor="cursor_next"
        onCursor={() => {}}
      />
    </div>
  );
}
