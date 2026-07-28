import { useState } from 'react';
import { RecoveryView, failureIdentity } from '@/features/platform/RecoveryView';
import { RecoveryCommandDialog, RecoveryInspector, type RecoveryAction } from '@/features/platform/RecoveryInspector';
import { failuresFixture } from './preview-fixtures';

/** Dev-only: Projection recovery queue with sample data. */
export function PreviewRecovery() {
  const [selected, setSelected] = useState<(typeof failuresFixture)[number] | undefined>(failuresFixture[0]);
  const [action, setAction] = useState<RecoveryAction>();
  const [reason, setReason] = useState('');
  return (
    <main className="min-h-dvh bg-bg">
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
        selectedKey={selected ? failureIdentity(selected) : undefined}
        onSelect={(failure) => { setSelected(failure); setAction(undefined); }}
        cursor={undefined}
        nextCursor="cursor_next"
        onCursor={() => {}}
      />
      <RecoveryInspector failure={selected} commandsEnabled onClose={() => { setSelected(undefined); setAction(undefined); }} onAction={(next) => { setReason(''); setAction(next); }} />
      <RecoveryCommandDialog failure={selected} action={action} reason={reason} pending={false} onReason={setReason} onClose={() => setAction(undefined)} onSubmit={() => setAction(undefined)} />
    </main>
  );
}
